import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
  INumberingOptions,
  LevelFormat,
} from "docx";
import { saveAs } from "file-saver";

interface ReportSummary {
  dates: string[];
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      title?: string;
    };
    reports: Record<
      string,
      {
        title?: string;
        summary?: string;
        status?: string;
        isLate?: boolean;
        tasksCompleted?: string[];
        blockers?: string | null;
        planForTomorrow?: string | null;
      } | null
    >;
  }[];
}

export async function exportReportsAsDocx(
  reportSummary: ReportSummary,
  startDate?: string,
  endDate?: string
) {
  const { data, dates } = reportSummary;

  // Define numbering for task lists
  const numbering: INumberingOptions = {
    config: [
      {
        reference: "tasks-numbering",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u1F60",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.5),
                  hanging: convertInchesToTwip(0.25),
                },
              },
            },
          },
        ],
      },
    ],
  };

  const doc = new Document({
    numbering: numbering,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "📄 Staff Daily Reports",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Date Range: ${startDate || "All"} → ${endDate || "All"}\n\n`,
                italics: true,
                size: 22,
              }),
            ],
          }),

          ...data.flatMap((u) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: `${u.user.name} (${u.user.role.toUpperCase()})`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Email: ${u.user.email}\nTitle: ${u.user.title || "N/A"}\n\n`,
                  size: 22,
                }),
              ],
            }),

            ...dates.flatMap((date) => {
              const r = u.reports[date];
              if (!r)
                return [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `📅 ${date}: No Report Submitted.\n`,
                        italics: true,
                        color: "888888",
                        size: 22,
                      }),
                    ],
                  }),
                ];

              const color = r.isLate ? "FF0000" : "008000";
              return [
                new Paragraph({
                  heading: HeadingLevel.HEADING_3,
                  children: [
                    new TextRun({
                      text: `📅 ${date}`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Status: ${r.status || "N/A"}${r.isLate ? " (Late)" : ""}\n`,
                      color,
                      bold: !!r.isLate,
                      size: 22,
                    }),
                  ],
                }),
                ...(r.title
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Title: ${r.title}\n`,
                            size: 22,
                          }),
                        ],
                      }),
                    ]
                  : []),
                ...(r.summary
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Summary: ${r.summary}\n`,
                            size: 22,
                          }),
                        ],
                      }),
                    ]
                  : []),

                // ✅ Properly numbered tasks
                ...(r.tasksCompleted?.length
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Tasks Completed:`,
                            bold: true,
                            size: 22,
                          }),
                        ],
                      }),
                      ...r.tasksCompleted.map(
                        (task) =>
                          new Paragraph({
                            text: task,
                            numbering: {
                              reference: "tasks-numbering",
                              level: 0,
                            },
                            spacing: { after: 100 },
                          })
                      ),
                    ]
                  : []),

                ...(r.blockers
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Blockers: ${r.blockers}\n`,
                            size: 22,
                            color: "FF0000",
                          }),
                        ],
                      }),
                    ]
                  : []),
                ...(r.planForTomorrow
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Plan for Tomorrow: ${r.planForTomorrow}\n`,
                            size: 22,
                          }),
                        ],
                      }),
                    ]
                  : []),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "--------------------------------------------------------------------------------\n\n",
                    }),
                  ],
                }),
              ];
            }),
            new Paragraph({ children: [new TextRun({ text: "\n" })] }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Daily-Reports-${startDate || "All"}-${endDate || "All"}.docx`;
  saveAs(blob, filename);
}
