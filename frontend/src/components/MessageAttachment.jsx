import { useEffect, useState } from "react";

import { fetchFileBlob } from "../services/fileService";

const MessageAttachment = ({ message }) => {
  const [objectUrl, setObjectUrl] = useState(
    message.localPreviewUrl || null
  );
  const [loading, setLoading] = useState(
    !message.localPreviewUrl &&
      !!message.attachment?.fileId
  );
  const [error, setError] = useState(false);

  const messageType =
    message.messageType || "document";
  const fileName =
    message.attachment?.fileName || "File";
  const caption = message.content?.trim();

  useEffect(() => {
    if (message.localPreviewUrl) {
      setObjectUrl(message.localPreviewUrl);
      setLoading(false);

      return () => {
        URL.revokeObjectURL(
          message.localPreviewUrl
        );
      };
    }

    const fileId = message.attachment?.fileId;

    if (!fileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let createdUrl = null;

    const loadFile = async () => {
      setLoading(true);
      setError(false);

      try {
        const blob = await fetchFileBlob(fileId);

        if (cancelled) {
          return;
        }

        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [
    message.attachment?.fileId,
    message.localPreviewUrl,
  ]);

  if (loading) {
    return (
      <div className="message-attachment-loading">
        Loading attachment...
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className="message-attachment-error">
        {fileName}
      </div>
    );
  }

  return (
    <div className="message-attachment">
      {messageType === "image" && (
        <img
          src={objectUrl}
          alt={fileName}
          className="message-image"
        />
      )}

      {messageType === "video" && (
        <video
          src={objectUrl}
          controls
          className="message-video"
        />
      )}

      {messageType === "document" && (
        <a
          href={objectUrl}
          download={fileName}
          className="message-document"
        >
          📎 {fileName}
        </a>
      )}

      {caption && (
        <div className="message-caption">
          {caption}
        </div>
      )}
    </div>
  );
};

export default MessageAttachment;
