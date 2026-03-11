import { useSandpack } from "@codesandbox/sandpack-react";

function OpenPreviewButton() {
  const { sandpack } = useSandpack();

  const openPreview = () => {
    const iframe = document.querySelector(
      ".sp-preview iframe"
    ) as HTMLIFrameElement | null;

    if (iframe?.src) {
      window.open(iframe.src, "_blank");
    } else {
      console.log("Preview iframe not found");
    }
  };

  return (
    <button
      onClick={openPreview}
      className="px-3 py-1 bg-green-500 rounded"
    >
      Open Desktop Preview
    </button>
  );
}

export default OpenPreviewButton;