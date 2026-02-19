
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
    orientation: "landscape", // Set orientation to landscape
    unit: "pt",
    format: "a4",
  });

  const pdfWidth = doc.internal.pageSize.getWidth();
  const margin = 30; // Increased margin for better spacing

  for (let i = 0; i < dayBuckets.length; i++) {
    const day = dayBuckets[i];
    const sheetElement = document.getElementById(`log-sheet-${day.dateKey}`);

    if (!sheetElement) {
      console.error(`Could not find log sheet element for date: ${day.dateKey}`);
      continue;
    }

    // --- MODIFICATION: Handle scrollable remarks section ---
    const remarksElement = sheetElement.querySelector(".remarks-section");
    const originalRemarksStyle = {
      height: remarksElement ? remarksElement.style.height : "",
      overflowY: remarksElement ? remarksElement.style.overflowY : "",
    };

    try {
      // Temporarily change styles to show all content
      if (remarksElement) {
        remarksElement.style.height = "auto";
        remarksElement.style.overflowY = "visible";
      }

      const dataUrl = await domtoimage.toPng(sheetElement, {
        quality: 1.0,
        bgcolor: "#ffffff",
      });

      if (i > 0) {
        doc.addPage();
      }

      const imgProps = doc.getImageProperties(dataUrl);
      const imageWidth = pdfWidth - margin * 2;
      const imageHeight = (imgProps.height * imageWidth) / imgProps.width;

      doc.addImage(dataUrl, "PNG", margin, margin, imageWidth, imageHeight);
      
    } catch (error) {
      console.error(`Failed to capture log sheet for ${day.dateKey}`, error);
      alert(
        `An error occurred while generating the PDF for ${day.dateKey}. Please check the console.`
      );
    } finally {
      // ALWAYS restore original styles
      if (remarksElement) {
        remarksElement.style.height = originalRemarksStyle.height;
        remarksElement.style.overflowY = originalRemarksStyle.overflowY;
      }
    }
  }

  const driverName = metadata.driverName
    ? `-${metadata.driverName.replace(/ /g, "_")}`
    : "";
  doc.save(`ELD-Log${driverName}-${new Date().toISOString().split("T")[0]}.pdf`);
};
