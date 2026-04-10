import * as XLSX from 'xlsx';

export const generateExcelReport = (
  activeElection: any,
  totalRegistered: number,
  stats: any,
  results: any[]
) => {
  if (!activeElection) return;

  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString();

  const totalVotes = stats.votedCount;
  const turnoutRate = stats.turnoutPercentage;
  const abstentionRate = ((totalRegistered - totalVotes) / totalRegistered * 100).toFixed(2);

  const overview = [
    ["ELECTION OVERVIEW SUMMARY"],
    ["Election Title", activeElection.title],
    ["Generated", timestamp],
    [],
    ["Total Registered", totalRegistered],
    ["Total Votes Cast", totalVotes],
    ["Turnout Rate", `${turnoutRate}%`],
    ["Total Candidates", stats.totalCandidates],
    [],
    ["Summary",
      `The election recorded a turnout of ${turnoutRate}%, with ${totalVotes} out of ${totalRegistered} voters participating.`]
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overview);

  const participation = [
    ["Rate", "Ratings"],
    ["Turnout Rate", `${turnoutRate}%`],
    ["Abstention Rate", `${abstentionRate}%`],
  ];

  const wsParticipation = XLSX.utils.aoa_to_sheet(participation);

  const header = [
    "Position", "Scope", "Candidate", "Votes", "Vote Percentage (%)", "Ranking", "Winner"
  ];

  const performance: any[] = [header];
  const dcsSheet: any[] = [header];
  const disSheet: any[] = [header];

  const winnersSummary = [
    ["Position", "Scope", "Winner", "Votes", "Vote Percentage (%)"]
  ];

  results.forEach(pos => {
    const scope = pos.department === 'ALL' ? 'College-wide' : pos.department;

    if (!pos.candidates.length) {
      winnersSummary.push([pos.positionName, scope, "Vacant", 0, "0%"]);
      return;
    }

    pos.candidates.forEach((c: any, index: number) => {
      const isWinner = index === 0 && c.totalVotes > 0;

      const row = [
        pos.positionName,
        scope,
        c.name,
        c.totalVotes,
        `${c.percentage}%`,
        index + 1,
        isWinner ? "🏆 Winner" : ""
      ];

      performance.push(row);

      if (pos.department === 'DCS') dcsSheet.push(row);
      if (pos.department === 'DIS') disSheet.push(row);

      if (isWinner) {
        winnersSummary.push([
          pos.positionName,
          scope,
          c.name,
          c.totalVotes,
          `${c.percentage}%`
        ]);
      }
    });
  });

  const wsPerformance = XLSX.utils.aoa_to_sheet(performance);
  const wsDCS = XLSX.utils.aoa_to_sheet(dcsSheet);
  const wsDIS = XLSX.utils.aoa_to_sheet(disSheet);
  const wsWinners = XLSX.utils.aoa_to_sheet(winnersSummary);

  const applyWinnerStyle = (ws: any) => {
    const range = XLSX.utils.decode_range(ws['!ref'] || "");

    for (let R = 1; R <= range.e.r; ++R) {
      const winnerCell = XLSX.utils.encode_cell({ r: R, c: 6 });
      const cell = ws[winnerCell];

      if (cell && cell.v === "🏆 Winner") {
        for (let C = 0; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) continue;

          ws[addr].s = {
            fill: { fgColor: { rgb: "C6EFCE" } },
            font: { bold: true }
          };
        }
      }
    }
  };

  applyWinnerStyle(wsPerformance);
  applyWinnerStyle(wsDCS);
  applyWinnerStyle(wsDIS);

  const colWidths = [
    { wch: 25 }, { wch: 20 }, { wch: 25 },
    { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }
  ];

  [wsPerformance, wsDCS, wsDIS, wsWinners].forEach(ws => {
    ws['!cols'] = colWidths;
  });

  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
  XLSX.utils.book_append_sheet(wb, wsParticipation, "Participation Ratings");
  XLSX.utils.book_append_sheet(wb, wsPerformance, "All Performance");
  XLSX.utils.book_append_sheet(wb, wsDCS, "DCS Performance");
  XLSX.utils.book_append_sheet(wb, wsDIS, "DIS Performance");
  XLSX.utils.book_append_sheet(wb, wsWinners, "Winners Result");

  const fileName = `MSU_CICS_${activeElection.title.replace(/\s+/g, '_')}_Advanced_Report.xlsx`;
  XLSX.writeFile(wb, fileName);
};