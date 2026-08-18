import { notification } from "ant-design-vue";

export const showNotification = (type, message) => {
  notification[type]({
    message: message,
    duration: 1.5,
  });
};

export const extractErrorMessage = (data, fallback) => {
  const message = data?.message;

  if (typeof message === "string") return message;

  if (message && typeof message === "object") {
    const first = Object.values(message)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === "string") return first;
  }

  return fallback;
};

export const isErrorResponse = (response) =>
  !response || response.status < 200 || response.status >= 300 ||
  response.data?.status === "error";
