const V1_API = "/api/v1";

export const apiUrls = {
  chatflow: {
    chat_flow: `${V1_API}/chatflows/{account_name}/start/`,
    chatflow_notification: `${V1_API}/chatflows/`,
    upload_media: `${V1_API}/upload-media/`,
  },
};
