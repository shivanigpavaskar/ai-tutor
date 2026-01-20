import { apiUrls } from "../core/apis/apis";
import useAxios from "../core/hooks/useAxios";
const BASE_URL = "/api/v1/chatflows";

const ChatFlowService = () => {
  const axios = useAxios();

  return {
    chatflow: (accountName: string, payload: any) => {
      return axios.post(`${BASE_URL}/${accountName}/start/`, payload);
    },
    chatflow_history: (accountName: string, payload: any, pagination: any) => {
      return axios.get(
        `${BASE_URL}/${accountName}/start/?limit=${pagination.limit}&offset=${pagination.offset}`,
        payload
      );
    },
    chatflow_notification: (accountName: any, payload: any) => {
      return axios.get(
        `${apiUrls.chatflow.chatflow_notification}${accountName}/chat-notifications/`,
        payload
      );
    },
    upload_media: (payload: FormData) => {
      return axios.post(`${apiUrls.chatflow.upload_media}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  };
};

export default ChatFlowService;
