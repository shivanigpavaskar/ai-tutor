import React from "react";
import "./assets/scss/_mediaRenderer.scss";

interface MediaRendererProps {
  media_type: string;
  media_url: string;
  width?: string;
  height?: string;
  caption?: string;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({
  media_type,
  media_url,
  width = "100%",
  height = "auto",
  caption,
}) => {
  const extension = media_type.includes("/")
    ? media_type.split("/").pop()?.toLowerCase() || ""
    : media_type.replace(".", "").toLowerCase();

  const rawFileName = media_url.split("?")[0].split("/").pop() || "File";

  const getCleanFileName = (name: string) => {
    const decodedName = decodeURIComponent(name);
    const nameWithoutExt = decodedName.replace(/\.[^/.]+$/, "");
    const match = nameWithoutExt.match(/^\d{8}_\d{6}_(.+)$/);
    return match ? match[1] : nameWithoutExt;
  };

  const cleanFileName = getCleanFileName(rawFileName);

  const captionEl = caption ? (
    <div className="media-caption" style={{ maxWidth: width }}>
      {caption}
    </div>
  ) : null;

  const imageExts = ["png", "jpeg", "jpg", "svg"];
  const videoExts = ["mp4", "mov"];
  const audioExts = ["mp3", "wav"];
  const docExts = ["pdf", "doc", "docx", "xlsx", "csv", "txt"];

  if (imageExts.includes(extension)) {
    return (
      <div className="media-wrapper">
        <img
          src={media_url}
          alt={cleanFileName}
          className="media-img"
          style={{ width, height }}
        />
        {captionEl}
      </div>
    );
  }

  if (videoExts.includes(extension)) {
    return (
      <div className="media-wrapper">
        <video
          controls
          src={media_url}
          className="media-video"
          style={{ width, height, maxHeight: "400px" }}
        />
        {captionEl}
      </div>
    );
  }

  if (audioExts.includes(extension)) {
    return (
      <div className="media-wrapper">
        <audio controls className="media-audio">
          <source src={media_url} type={`audio/${extension}`} />
          Your browser does not support the audio element.
        </audio>
        {captionEl}
      </div>
    );
  }

  if (docExts.includes(extension)) {
    return (
      <div className="media-container">
        <a
          href={media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="media-link"
        >
          {extension === "pdf" && <span className="media-icon">📄</span>}
          {cleanFileName}
        </a>
        {captionEl}
      </div>
    );
  }

  return (
    <div className="media-container">
      <div className="media-unknown">{cleanFileName}</div>
      {captionEl}
    </div>
  );
};

export default MediaRenderer;
