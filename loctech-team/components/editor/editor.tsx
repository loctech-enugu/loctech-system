'use client'

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { fontNames, toolbarOptions } from './toolbar';
import "./font.css";

const Font = ReactQuill.Quill.import("attributors/class/font") as { whitelist: string[] };
Font.whitelist = fontNames;
ReactQuill.Quill.register("attributors/class/font", Font, true);

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Editor({ value, onChange, placeholder, className }: EditorProps) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      modules={{ toolbar: toolbarOptions }}
      className={className}
    />
  );
}