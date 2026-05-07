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
    ["MSU CICS ELECTION ANALYTICS REPORT"],
    ["Election Title", activeElection.title],
    ["Report Generated", timestamp],
    ["Total Registered Voters", totalRegistered],
    [],
    ["ELECTION STATISTICS"],
    ["Metric", "Value"],
    ["Total Registered Voters", totalRegistered],
    ["Total Ballots Cast", totalVotes],
    ["Total Candidates", stats.totalCandidates],
    ["Turnout Rate", `${turnoutRate}%`],
    ["Abstention Rate", `${abstentionRate}%`],
    [],
    ["EXECUTIVE SUMMARY"],
    [`Election: ${activeElection.title}`],
    [`Generated: ${timestamp}`],
    [`Turnout: ${turnoutRate}% (${totalVotes} out of ${totalRegistered} voters participated)`],
    [`Total Candidates: ${stats.totalCandidates} across all positions`],
    [`Abstention Rate: ${abstentionRate}% (${totalRegistered - totalVotes} voters did not participate)`]
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overview);

  const header = [
    "Position", "Scope", "Candidate", "Votes", "Vote Percentage (%)", "Ranking", "Status"
  ];

  const allPerformance: any[] = [header];
  const dcsSheet: any[] = [header];
  const disSheet: any[] = [header];
  const winnersSummary = [
    ["🏆 ELECTION WINNERS CIRCLE 🏆"],
    ["Election Title", activeElection.title],
    ["Report Generated", timestamp],
    [],
    ["Position", "Scope", "Winner Name", "Total Votes", "Winning Percentage (%)", "Status"],
    ...results.flatMap(pos => {
      const scope = pos.department === 'ALL' ? 'College-wide' : `${pos.department} Department`;
      if (!pos.candidates || pos.candidates.length === 0) return [];

      const winner = pos.candidates[0];
      if (!winner || winner.totalVotes === 0) return [];

      return [[
        pos.positionName,
        scope,
        winner.name,
        winner.totalVotes,
        `${winner.percentage}%`,
        "🏆 ELECTED"
      ]];
    })
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

  const applyHeaderStyle = (ws: any, headerRowIndex: number = 0) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let C = 0; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
      if (ws[addr]) {
        ws[addr].s = {
          font: { bold: true, sz: 12, color: { rgb: "2F318D" } },
          fill: { fgColor: { rgb: "E8EAF6" } },
          border: {
            top: { style: "thin", color: { rgb: "2F318D" } },
            bottom: { style: "thin", color: { rgb: "2F318D" } },
            left: { style: "thin", color: { rgb: "2F318D" } },
            right: { style: "thin", color: { rgb: "2F318D" } }
          }
        };
      }
    }
  };

  const applyOverviewStyle = (ws: any) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        const cellValue = ws[addr].v;
        if (typeof cellValue === 'string' && cellValue.includes('ANALYTICS REPORT')) {
          ws[addr].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2F318D" } },
            alignment: { horizontal: "center" }
          };
        } else if (typeof cellValue === 'string' && (
          cellValue.includes('STATISTICS') ||
          cellValue.includes('SUMMARY')
        )) {
          ws[addr].s = {
            font: { bold: true, sz: 14, color: { rgb: "2F318D" } },
            fill: { fgColor: { rgb: "F3E5F5" } }
          };
        }
      }
    }
  };

  const applyWinnersStyle = (ws: any) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        const cellValue = ws[addr].v;
        if (typeof cellValue === 'string' && cellValue.includes('WINNERS CIRCLE')) {
          ws[addr].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "FFD700" } },
            alignment: { horizontal: "center" }
          };
        } else if (typeof cellValue === 'string' && cellValue.includes('🏆 ELECTED')) {
          ws[addr].s = {
            font: { bold: true, color: { rgb: "B8860B" } },
            fill: { fgColor: { rgb: "FFF8DC" } }
          };
        }
      }
    }
  };

  applyWinnerStyle(wsPerformance);
  applyWinnerStyle(wsDCS);
  applyWinnerStyle(wsDIS);
  applyHeaderStyle(wsPerformance, 0);
  applyHeaderStyle(wsDCS, 0);
  applyHeaderStyle(wsDIS, 0);
  applyOverviewStyle(wsOverview);
  applyWinnersStyle(wsWinners);

  const colWidths = [
    { wch: 25 }, 
    { wch: 18 }, 
    { wch: 30 }, 
    { wch: 12 }, 
    { wch: 20 }, 
    { wch: 10 }, 
    { wch: 15 }  
  ];

  const overviewColWidths = [
    { wch: 30 }, 
    { wch: 40 }  
  ];

  const winnersColWidths = [
    { wch: 25 }, 
    { wch: 18 }, 
    { wch: 30 }, 
    { wch: 12 }, 
    { wch: 20 }, 
    { wch: 15 }  
  ];

  wsOverview['!cols'] = overviewColWidths;
  wsWinners['!cols'] = winnersColWidths;
  [wsPerformance, wsDCS, wsDIS].forEach(ws => {
    ws['!cols'] = colWidths;
  });

  XLSX.utils.book_append_sheet(wb, wsOverview, "📊 Election Overview");
  XLSX.utils.book_append_sheet(wb, wsWinners, "🏆 Winners Circle");
  XLSX.utils.book_append_sheet(wb, wsPerformance, "📈 Complete Results");
  XLSX.utils.book_append_sheet(wb, wsDCS, "🎓 DCS Department");
  XLSX.utils.book_append_sheet(wb, wsDIS, "🎓 DIS Department");

  const fileName = `MSU_CICS_Election_${activeElection.title.replace(/[^a-zA-Z0-9]/g, '_')}_Analytics_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};