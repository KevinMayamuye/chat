export const getMessagePreviewText = (message) => {
  if (!message) {
    return "";
  }

  const type = message.messageType || "text";

  if (type === "image") {
    return "Photo";
  }

  if (type === "video") {
    return "Video";
  }

  if (type === "document") {
    const name =
      message.attachment?.fileName || "Document";

    return `📎 ${name}`;
  }

  return (message.content || "").replace(
    /\n+/g,
    " "
  );
};

export const getMessageTypeFromFile = (file) => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "document";
};
