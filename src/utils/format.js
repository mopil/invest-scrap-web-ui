export function getRelativeDateString(dayOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + dayOffset);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("ko-KR");
}

export function buildDocumentUrl(boardId, documentId) {
  if (!boardId || !documentId) {
    return "#";
  }

  return `https://gall.dcinside.com/mgallery/board/view/?id=${encodeURIComponent(boardId)}&no=${encodeURIComponent(documentId)}`;
}

export function rowKey(id) {
  return String(id);
}
