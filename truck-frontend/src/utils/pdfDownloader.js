
import jsPDF from "jspdf";
import domtoimage from "dom-to-image-more";

/**
 * Downloads the currently displayed ELD log sheets as a single PDF document.
 * It captures each daily log sheet as an image and adds it to a page in the PDF.
 *
 * @param {Array} dayBuckets - The array of daily log data, used to find the DOM elements.
 * @param {Object} metadata - The metadata object to get the driver's name for the filename.
 */
export const downloadEldAsPdf = async (dayBuckets, metadata) => {
  if (!dayBuckets || dayBuckets.length === 0) {
    alert("There is no log data to download.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pdfWidth = doc.internal.pageSize.getWidth();
  const margin = 30;

  for (let i = 0; i < dayBuckets.length; i++) {
    const day = dayBuckets[i];
    const sheetElement = document.getElementById(`log-sheet-${day.dateKey}`);

    if (!sheetElement) {
      console.error(`Could not find log sheet element for date: ${day.dateKey}`);
      continue;
    }

    let clonedSheet = null; 
    try {
      clonedSheet = sheetElement.cloneNode(true);
      const originalWidth = sheetElement.offsetWidth;
      
      clonedSheet.style.position = 'absolute';
      clonedSheet.style.top = '0px';
      clonedSheet.style.left = '-9999px';
      clonedSheet.style.width = `${originalWidth}px`; 

      document.body.appendChild(clonedSheet);

      const clonedRemarks = clonedSheet.querySelector(".remarks-section");
      if (clonedRemarks) {
        clonedRemarks.style.height = "auto";
        clonedRemarks.style.overflowY = "visible";
      }

      // Capture the cloned element with higher resolution and a clean background.
      const dataUrl = await domtoimage.toPng(clonedSheet, {
        quality: 1.0,
        scale: 3, // Increased scale from 2 to 3 for much better resolution.
        bgcolor: '#ffffff', // Force a solid white background to prevent style conflicts.
      });

      // --- PDF Generation ---
      if (i > 0) {
        doc.addPage();
      }

      const imgProps = doc.getImageProperties(dataUrl);
      const imageWidth = pdfWidth - margin * 2;
      const imageHeight = (imgProps.height * imageWidth) / imgProps.width;

      doc.addImage(dataUrl, "PNG", margin, margin, imageWidth, imageHeight);
      
    } catch (error) {
      console.error(`Failed to capture log sheet for ${day.dateKey}`, error);
      alert(`An error occurred while generating the PDF for ${day.dateKey}. Please check the console.`);
    } finally {
      if (clonedSheet) {
        document.body.removeChild(clonedSheet);
      }
    }
  }

  const driverName = metadata.driverName ? `-${metadata.driverName.replace(/ /g, "_")}` : "";
  doc.save(`ELD-Log${driverName}-${new Date().toISOString().split("T")[0]}.pdf`);
};
