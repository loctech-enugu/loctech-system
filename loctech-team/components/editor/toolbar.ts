export const fonts = [
  "Lato",
  "Arial",
  "Courier",
  "Garamond",
  "Tahoma",
  "Times New Roman",
  "Verdana",
];

export function getFontName(font: string) {
  return font.toLowerCase().replace(/\s/g, "-");
}
export const fontNames = fonts.map((font) => getFontName(font));

export const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],
  [
    "link",
    "image"
  ],
  [
    {
      header: 1,
    },
    {
      header: 2,
    },
  ], // custom button values
  [
    {
      list: "ordered",
    },
    {
      list: "bullet",
    },
  ],
  [
    {
      script: "sub",
    },
    {
      script: "super",
    },
  ], // superscript/subscript
  [
    {
      indent: "-1",
    },
    {
      indent: "+1",
    },
  ], // outdent/indent
  [
    {
      direction: "rtl",
    },
  ], // text direction

  [
    {
      size: ["small", false, "large", "huge"],
    },
  ], // custom dropdown
  [
    {
      header: [1, 2, 3, 4, 5, 6, false],
    },
  ],

  [
    {
      color: [],
    },
    {
      background: [],
    },
  ], // dropdown with defaults from theme
  [
    {
      font: fontNames,
    },
  ],
  [
    {
      align: [],
    },
  ],

  ["clean"], // remove formatting button
],
  formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];
