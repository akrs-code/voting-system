import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64Image = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export const generateVoteReceipt = async (data: {
  voterName: string;
  electionTitle: string;
  ballotId: string;
  votes: { positionName: string; candidateName: string }[];
  timestamp: string;
}) => {
  const doc = new jsPDF();
  const primaryColor = [47, 49, 141];
  const textColor = [30, 27, 75];

  try {
    try {
      const logoBase64 = await getBase64Image('/cics.png');
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
    } catch (e) {
      console.warn('Logo could not be loaded for PDF', e);
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MSU CICS E-VOTING SYSTEM', 40, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 35, 210, 2, 'F');

    doc.setFillColor(248, 250, 252);
    doc.rect(14, 45, 182, 40, 'F');

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('VOTER DETAILS', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Voter Name:`, 20, 65);
    doc.setFont('helvetica', 'bold');
    doc.text(data.voterName, 50, 65);

    doc.setFont('helvetica', 'normal');
    doc.text(`Election:`, 20, 72);
    doc.setFont('helvetica', 'bold');
    doc.text(data.electionTitle, 50, 72);

    doc.setFont('helvetica', 'normal');
    doc.text(`Timestamp:`, 20, 79);
    doc.text(data.timestamp, 50, 79);

    doc.setFillColor(238, 242, 255);
    doc.roundedRect(140, 50, 50, 25, 3, 3, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT ID', 145, 58);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(data.ballotId, 145, 65, { maxWidth: 40 });

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL SELECTIONS', 14, 100);

    const tableData = data.votes.map(v => [v.positionName.toUpperCase(), v.candidateName]);

    autoTable(doc, {
      startY: 105,
      head: [['POSITION', 'SELECTED CANDIDATE']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 10,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
      },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    doc.setDrawColor(226, 232, 240);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(14, finalY + 10, 182, 25);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    const footerText = "Your vote is anonymous and securely encrypted. Individual selections cannot be traced back to your identity in the final tally. This document serves as your official cryptographic receipt for verification purposes.";
    doc.text(footerText, 20, finalY + 18, { maxWidth: 170, align: 'left' });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 MSU College of Information and Computing Sciences — E-Voting System', 105, finalY + 45, { align: 'center' });

    const safeTitle = data.electionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `Receipt_${safeTitle}.pdf`;

    // More robust download for mobile compatibility
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile browsers handle window.open/location better for blobs
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback if popup is blocked
        window.location.href = url;
      }
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } catch (error) {
    console.error('PDF Generation failed:', error);
    throw error;
  }
};
