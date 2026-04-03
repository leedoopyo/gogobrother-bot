/**
 * rows(2D array) → object 배열로 변환
 * 첫 번째 row를 헤더로 사용
 */
function rowsToObjects(rows) {
  const [header, ...data] = rows;
  if (!header) return [];

  return data.map((row) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = row[idx] ?? '';
    });
    return obj;
  });
}

module.exports = { rowsToObjects };
