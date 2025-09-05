export function createTwoFilesPatch(
  _oldFile: string,
  _newFile: string,
  oldStr: string,
  newStr: string
): string {
  return `--- a\n+++ b\n-${oldStr}\n+${newStr}`;
}
