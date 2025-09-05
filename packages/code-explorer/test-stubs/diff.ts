export function createTwoFilesPatch(
  _oldFile: string,
  _newFile: string,
  oldStr: string,
  newStr: string
): string {
  return `--- a\n+++ b\n-${oldStr}\n+${newStr}`;
}

export function applyPatch(original: string, patch: string): string | false {
  const lines = patch.split("\n");
  const removeLine = lines
    .find((line) => line.startsWith("-") && !line.startsWith("---"))
    ?.slice(1);
  const addLine = lines
    .find((line) => line.startsWith("+") && !line.startsWith("+++"))
    ?.slice(1);
  if (!removeLine || !addLine) return false;
  if (!original.includes(removeLine)) return false;
  return original.replace(removeLine, addLine);
}
