"use client";

import { createContext, useContext, useEffect } from "react";
import { useAuthSession } from "@/hooks";
import { set as idbSet, get as idbGet } from "idb-keyval";
import { checkDeviceExists, generateDeviceBundle } from "@/lib/sodium/crypto";
import { axiosAPI } from "@/config/axios";

const RegisterDeviceContext = createContext(null);

const RegisterDeviceProvider = (props: any) => {
  const { token, user } = useAuthSession();

  useEffect(() => {
    const registerUserDevice = async () => {
      try {
        const deviceId = `d_${user?.id.slice(-10)}`;
        const exists = await checkDeviceExists(deviceId);
        console.log("Device user agent ", navigator.userAgent);
        if (exists) {
          console.log("Device Already Registered - found:  ", exists);
          return;
        }
        // get sodium private and public key bundles
        const device = await generateDeviceBundle(deviceId);
        // register the device public keys on the server
        axiosAPI.accessToken = token;
        const result = await axiosAPI.post(
          `/v1/conversations/users/${user.id}/register-device`,
          device.publicBundle
        );
        // save user private keys to index db - keep it on device
        await idbSet(device.storeKey, device.privateBundle)
        console.log("User Device Registered ", result.data);
      } catch (error) {
        console.log("User Device Registration error ", error);
      }
    };

    registerUserDevice();

    return () => {};
    // eslint-disable-next-line
  }, []);

  return (
    <RegisterDeviceContext.Provider value={null}>
      {props.children}
    </RegisterDeviceContext.Provider>
  );
};

export default RegisterDeviceProvider;
