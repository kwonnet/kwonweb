import { CoinPackage, PaymentSubscriptionOptions, PlanTypeEnum, TxnCurrencyEnum, TxnGatewayEnum, TxnSourceEnum, User } from "@/types";
import { FlutterwaveConfig } from "flutterwave-react-v3/dist/types";
import { genUniqueRef, get_tzx_usd_rate } from ".";
import { flwPublicKey, flwRedirectUrl } from "@/config";

export const getFlutterWaveCoinConfig = (user: User, item: CoinPackage):FlutterwaveConfig => {
    const amount = get_tzx_usd_rate(item.price)
    const config: FlutterwaveConfig = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBK as string,
        redirect_url: process.env.NEXT_PUBLIC_FLUTTERWAVE_REDIRECT_URL,
        tx_ref: genUniqueRef(),
        amount,
        currency: "USD",
        payment_options: "card,mobilemoney,ussd,nqr,barter,account,banktransfer",
        customer: {
          email: user.email,
          name: user.name,
          phone_number: "0000000",
        },
        customizations: {
          title: item.name,
          description: `Purchase ${item.name} coin package for $${amount}`,
          logo: String(process.env.NEXT_PUBLIC_APP_LOGO),
        },
        meta: {
            userId: user.id,
            telId: user.telId,
            type: "COIN_PACKAGE",
            id: item.id,
            name: item.name,
            amount: item.amount.toString(),
            price: item.price.toString(),
            bonus: item.bonus.toString(),
            isActive: item.isActive ,
            gateway: TxnGatewayEnum.FLUTTERWAVE,
            currency: TxnCurrencyEnum.USD, 
            source: TxnSourceEnum.FIAT
       }
      };
      return config
  }


  export const getFlutterWaveSubPlanConfig = (user: User, item: PaymentSubscriptionOptions & { planType: PlanTypeEnum, isRecurring: boolean}):FlutterwaveConfig => {

    const planRef = item.tierId ? String(`${item.planType}_${item.planId}_${item.tierId}`).toLowerCase() : String(`${item.planType}_${item.planId}`).toLowerCase()

    const planMeta = item?.metadata?.flw?.find(item => item.planRef === planRef)


    const config: FlutterwaveConfig = {
        public_key: flwPublicKey,
        redirect_url: flwRedirectUrl,
        tx_ref: genUniqueRef(),
        amount: item.amount,
        currency: item.currency,
        payment_plan: (item.isRecurring && planMeta) ? planMeta.flwId.toString() : undefined,
        payment_options: "card,mobilemoney,ussd,nqr,barter,account,banktransfer,enaira,opay,internetbanking,credit,googlepay,applepay,ghanamobilemoney,mobilemoneyfranco,1voucher,mobilemoneymalawi,mpesa,mobilemoneyuganda,mobilemoneyrwanda,mobilemoneytanzania",
        customer: {
          email: user.email,
          name: user.name,
          phone_number: "0000000",
        },
        customizations: {
          title: item.planName,
          description: `Pay ${item.currency} ${item.amount} for ${item.planName}`,
          logo: String(process.env.NEXT_PUBLIC_APP_LOGO),
        },
        meta: {
            userId: user.id,
            telId: user.telId,
            type: "APP_SUBSCRIPTION",
            planId: item.planId,
            price: item.price,
            discount: item.discount,
            tierId: item.tierId,
            gateway: item.gateway,
            amount: item.amount,
            isRecurring: item.isRecurring,
            planType: item.planType,
            planName: item.planName,
            currency: item.currency,
            source: item.source
       }
      };
      return config
  }