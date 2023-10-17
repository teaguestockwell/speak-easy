export function copyTextToClipboard(
  text: string,
  onSuccess?: () => unknown,
  onError?: () => unknown
) {
  try {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        onSuccess?.();
      } else {
        onError?.();
      }
    } else {
      navigator.clipboard.writeText(text).then(onSuccess, onError);
    }
  } catch {
  }
}
