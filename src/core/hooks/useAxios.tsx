
import { useEffect } from 'react';
import axios from '../apis/axios';

const useAxios = () => {

  useEffect(() => {
    const requestIntercept = axios.interceptors.request.use(
      (config: any) => {
        return config;
      },
      async (error) => Promise.reject(error),
    );

    const responseIntercept = axios.interceptors.response.use(
      (response) => {
        response.data = { ...response.data, ...response.data?.data };
        return response;
      },
      async (error) => {
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(responseIntercept);
      axios.interceptors.request.eject(requestIntercept);
    };
  }, []);

  return axios;
};

export default useAxios;
