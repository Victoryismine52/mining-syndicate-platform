import React from "react";
export const List = ({ rowRenderer, rowCount }: any) => (
  <div>{Array.from({ length: rowCount }).map((_, i) => rowRenderer({ index: i, key: i, style: {} }))}</div>
);
export default { List };
