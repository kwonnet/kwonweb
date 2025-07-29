import useSWR from "swr"
import { getTipPackages } from "."

export const useSWRTipPackages = (token?: string) => {
    const result = useSWR(['/v1/tips', token], ([_, token]) => getTipPackages( token), { keepPreviousData: true})
    return result
}