import React from "react";
import { BsTrash3 } from "react-icons/bs";

export const TRASH_ICON = (size?: string | number, className?: string) =>
  Spicetify.ReactDOMServer.renderToString(
    <BsTrash3 className={className} size={size} />,
  );
