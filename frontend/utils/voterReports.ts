import * as XLSX from 'xlsx';
import { Voter } from 'types/interface';

export const VoterReports = (voters: Voter[], electionTitle: string) => {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString();
  const ordinals = ["", "1st", "2nd", "3rd", "4th"];

  const votedList = voters.filter(v => v.hasVoted);
  const pendingList = voters.filter(v => !v.hasVoted);

  const turnoutRate = voters.length > 0 ? ((votedList.length / voters.length) * 100).toFixed(2) : "0.00";

  const deptStats = ['DCS', 'DIS'].map(dept => {
    const deptVoters = voters.filter(v => v.department === dept);
    const deptVoted = deptVoters.filter(v => v.hasVoted);
    const deptTurnout = deptVoters.length > 0 ? ((deptVoted.length / deptVoters.length) * 100).toFixed(2) : "0.00";
    return { department: dept, total: deptVoters.length, voted: deptVoted.length, pending: deptVoters.length - deptVoted.length, turnoutRate: deptTurnout };
  });

  const yearStats = [1, 2, 3, 4].map(year => {
    const yearVoters = voters.filter(v => v.yearLevel === year);
    const yearVoted = yearVoters.filter(v => v.hasVoted);
    const yearTurnout = yearVoters.length > 0 ? ((yearVoted.length / yearVoters.length) * 100).toFixed(2) : "0.00";
    return { yearLevel: `${ordinals[year]} Year`, total: yearVoters.length, voted: yearVoted.length, pending: yearVoters.length - yearVoted.length, turnoutRate: yearTurnout };
  });

  const summaryData = [
    ["MSU CICS VOTER PARTICIPATION ANALYTICS"],
    ["Election Title", electionTitle],
    ["Report Generated", timestamp],
    ["Total Registered Voters", voters.length],
    [],
    ["OVERALL STATISTICS"],
    ["Metric", "Count", "Percentage"],
    ["Total Registered Voters", voters.length, "100.00%"],
    ["Total Votes Cast", votedList.length, `${turnoutRate}%`],
    ["Pending Votes", pendingList.length, `${(100 - parseFloat(turnoutRate)).toFixed(2)}%`],
    [],
    ["DEPARTMENT BREAKDOWN"],
    ["Department", "Total Registered", "Votes Cast", "Pending", "Turnout Rate"],
    ...deptStats.map(stat => [stat.department, stat.total, stat.voted, stat.pending, `${stat.turnoutRate}%`]),
    [],
    ["YEAR LEVEL BREAKDOWN"],
    ["Year Level", "Total Registered", "Votes Cast", "Pending", "Turnout Rate"],
    ...yearStats.map(stat => [stat.yearLevel, stat.total, stat.voted, stat.pending, `${stat.turnoutRate}%`]),
    [],
    ["PARTICIPATION SUMMARY"],
    [`Overall Turnout Rate: ${turnoutRate}%`],
    [`${votedList.length} out of ${voters.length} registered voters have participated`],
    [`${pendingList.length} voters are yet to cast their ballots`]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  const mapVoterData = (list: Voter[]) => {
    return list.map(v => ({
      "Student ID": v.studentId,
      "Full Name": v.name,
      "Email": v.email,
      "Department": v.department,
      "Year Level": `${ordinals[v.yearLevel]} Year`,
      "Status": v.hasVoted ? "✓ COMPLETED" : "⏳ PENDING"
    }));
  };

  const wsVoted = XLSX.utils.json_to_sheet(mapVoterData(votedList));
  const wsPending = XLSX.utils.json_to_sheet(mapVoterData(pendingList));

  const dcsVoters = voters.filter(v => v.department === 'DCS');
  const disVoters = voters.filter(v => v.department === 'DIS');
  const wsDCS = XLSX.utils.json_to_sheet(mapVoterData(dcsVoters));
  const wsDIS = XLSX.utils.json_to_sheet(mapVoterData(disVoters));

  const colWidths = [
    { wch: 15 }, // Student ID
    { wch: 25 }, // Full Name
    { wch: 35 }, // Email
    { wch: 12 }, // Department
    { wch: 12 }, // Year Level
    { wch: 15 }, // Status
  ];

  const summaryColWidths = [
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 }
  ];

  [wsVoted, wsPending, wsDCS, wsDIS].forEach(ws => {
    ws['!cols'] = colWidths;
  });
  wsSummary['!cols'] = summaryColWidths;

  const applySummaryStyle = (ws: any) => {
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        const cellValue = ws[addr].v;
        if (typeof cellValue === 'string' && cellValue.includes('ANALYTICS')) {
          ws[addr].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2F318D" } },
            alignment: { horizontal: "center" }
          };
        } else if (typeof cellValue === 'string' && (
          cellValue.includes('STATISTICS') ||
          cellValue.includes('BREAKDOWN') ||
          cellValue.includes('SUMMARY')
        )) {
          ws[addr].s = {
            font: { bold: true, sz: 12, color: { rgb: "2F318D" } },
            fill: { fgColor: { rgb: "E8EAF6" } }
          };
        } else if (R > 0 && C === 0 && typeof cellValue === 'string' && (
          cellValue.includes('Department') || cellValue.includes('Year') || cellValue.includes('Metric')
        )) {
          ws[addr].s = {
            font: { bold: true, color: { rgb: "2F318D" } },
            fill: { fgColor: { rgb: "F3E5F5" } }
          };
        }
      }
    }
  };

  applySummaryStyle(wsSummary);

  XLSX.utils.book_append_sheet(wb, wsSummary, "📊 Analytics Overview");
  XLSX.utils.book_append_sheet(wb, wsVoted, "✓ Voted Students");
  XLSX.utils.book_append_sheet(wb, wsPending, "⏳ Pending Students");
  XLSX.utils.book_append_sheet(wb, wsDCS, "🎓 DCS Department");
  XLSX.utils.book_append_sheet(wb, wsDIS, "🎓 DIS Department");

  const fileName = `Voter_Participation_${electionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};