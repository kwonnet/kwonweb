'use client'
import { getContinentsAndCountries } from '@/lib/locations';
import useSWR from 'swr';
import useAuthSession from './useAuthSession';
import { Continent, Country } from '@/types';

const useContinentsCountries = () => {
    const { token } = useAuthSession()
    const { data, isLoading } = useSWR(`/continents`, () =>
        getContinentsAndCountries(token)
      );
    
      const countries: Country[] =
        !data && isLoading
          ? []
          : (data
              ?.map((item) => item.countries)
              .flatMap((item) => item)
              ?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);
    
      const continents: Continent[] =
        !data && isLoading
          ? []
          : (data?.sort((a, b) => a.name.localeCompare(b.name)) ?? []);
    return { countries, continents}     
}

export default useContinentsCountries