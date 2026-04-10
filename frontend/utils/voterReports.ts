import * as XLSX from 'xlsx';
import { Voter } from 'types/interface';

export const VoterReports = (voters: Voter[], electionTitle: string) => {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString();

  const votedList = voters.filter(v => v.hasVoted);
  const pendingList = voters.filter(v => !v.hasVoted);

  const summaryData = [
    ["VOTER PARTICIPATION SUMMARY"],
    ["Election Title", electionTitle],
    ["Report Generated", timestamp],
    [],
    ["Category", "Count", "Percentage"],
    ["Total Registered", voters.length, "100%"],
    ["Total Voted", votedList.length, `${((votedList.length / voters.length) * 100).toFixed(2)}%`],
    ["Total Pending", pendingList.length, `${((pendingList.length / voters.length) * 100).toFixed(2)}%`],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  const mapVoterData = (list: Voter[]) => {
    return list.map(v => ({
      "Student ID": v.studentId,
      "Full Name": v.name,
      "Email": v.email,
      "Department": v.department,
      "Year Level": `${v.yearLevel} Year`,
      "Status": v.hasVoted ? "COMPLETED" : "PENDING"
    }));
  };

  const wsVoted = XLSX.utils.json_to_sheet(mapVoterData(votedList));
  const wsPending = XLSX.utils.json_to_sheet(mapVoterData(pendingList));

  const colWidths = [
    { wch: 15 }, 
    { wch: 25 },
    { wch: 30 }, 
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 15 }, 
  ];

  [wsVoted, wsPending].forEach(ws => {
    ws['!cols'] = colWidths;
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, "Statistics");
  XLSX.utils.book_append_sheet(wb, wsVoted, "Voted Students");
  XLSX.utils.book_append_sheet(wb, wsPending, "Pending Students");

  const fileName = `Voter_Participation_${electionTitle.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};