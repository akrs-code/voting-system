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
  const abstentionRate = (100 - parseFloat(turnoutRate)).toFixed(2);

  const overview = [
    ["ELECTION OVERVIEW SUMMARY"],
    ["Election Title", activeElection.title],
    ["Generated", timestamp],
    [],
    ["STATISTICS"],
    ["Total Registered Voters", totalRegistered],
    ["Total Ballots Cast", totalVotes],
    ["Total Candidates", stats.totalCandidates],
    ["Final Turnout Rate", `${turnoutRate}%`],
    ["Abstention Rate", `${abstentionRate}%`],
    [],
    ["Narrative Summary", 
     `As of ${timestamp}, the election "${activeElection.title}" recorded a turnout of ${turnoutRate}%, with ${totalVotes} out of ${totalRegistered} voters participating.`]
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overview);

  const header = [
    "Position", "Scope", "Candidate", "Votes", "Vote Percentage (%)", "Ranking", "Status"
  ];

  const allPerformance: any[] = [header];
  const dcsSheet: any[] = [header];
  const disSheet: any[] = [header];
  const winnersSummary = [
    ["Position", "Scope", "Winner Name", "Total Votes", "Winning Percentage (%)"]
  ];

  results.forEach(pos => {
    const scope = pos.department === 'ALL' ? 'College-wide' : `${pos.department} Department`;

    if (!pos.candidates || pos.candidates.length === 0) {
      const emptyRow = [pos.positionName, scope, "No Candidates Registered", 0, "0%", "-", "N/A"];
      allPerformance.push(emptyRow);
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

      allPerformance.push(row);
    
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

 
  const wsPerformance = XLSX.utils.aoa_to_sheet(allPerformance);
  const wsDCS = XLSX.utils.aoa_to_sheet(dcsSheet);
  const wsDIS = XLSX.utils.aoa_to_sheet(disSheet);
  const wsWinners = XLSX.utils.aoa_to_sheet(winnersSummary);

 
  const applyWinnerStyle = (ws: any) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = 1; R <= range.e.r; ++R) {
      const statusCell = XLSX.utils.encode_cell({ r: R, c: 6 }); 
      if (ws[statusCell] && ws[statusCell].v === "🏆 Winner") {
        for (let C = 0; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) continue;
          ws[addr].s = {
            fill: { fgColor: { rgb: "C6EFCE" } }, 
            font: { bold: true, color: { rgb: "006100" } }
          };
        }
      }
    }
  };

  applyWinnerStyle(wsPerformance);
  applyWinnerStyle(wsDCS);
  applyWinnerStyle(wsDIS);

  const colWidths = [
    { wch: 25 }, { wch: 20 }, { wch: 30 },
    { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 15 }
  ];

  [wsPerformance, wsDCS, wsDIS, wsWinners].forEach(ws => {
    ws['!cols'] = colWidths;
  });

  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
  XLSX.utils.book_append_sheet(wb, wsWinners, "Winners Circle");
  XLSX.utils.book_append_sheet(wb, wsPerformance, "General Results");
  XLSX.utils.book_append_sheet(wb, wsDCS, "DCS Dept");
  XLSX.utils.book_append_sheet(wb, wsDIS, "DIS Dept");

  const fileName = `MSU_CICS_${activeElection.title.replace(/\s+/g, '_')}_Analytics_Report.xlsx`;
  XLSX.writeFile(wb, fileName);
};