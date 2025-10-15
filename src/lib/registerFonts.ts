// yellow-diamond-learn-main/src/lib/registerFonts.ts

// Import the font data objects from your modified font files
import { font_NotoSansDevanagari_Regular_normal } from '../fonts/NotoSansDevanagari-normal';
import { font_NotoSansDevanagari_Bold_bold } from '../fonts/NotoSansDevanagari-bold';
import { font_NotoSansKannada_Regular_normal } from '../fonts/NotoSansKannada-normal';
import { font_NotoSansKannada_Bold_bold } from '../fonts/NotoSansKannada-bold';


// jsPDF itself is needed here to access its API for registration
import { jsPDF } from 'jspdf';

//fontsRegistered' flag as it was preventing re-registration on new doc instances.
// We want this function to always register fonts to the provided 'doc' instance.
// let fontsRegistered = false;

// This function will receive a jsPDF instance to add fonts to.
export const registerCustomFonts = (doc: jsPDF) => {
  // if (fontsRegistered) {
  //   return; // Only register once
  // }

  try {
    // Manually add the font to VFS and register it.
    // Use `doc` instance directly to ensure context.
    
    // Noto Sans Devanagari normal
    doc.addFileToVFS(font_NotoSansDevanagari_Regular_normal.filename, font_NotoSansDevanagari_Regular_normal.data);
    doc.addFont(
      font_NotoSansDevanagari_Regular_normal.filename,
      font_NotoSansDevanagari_Regular_normal.name,
      font_NotoSansDevanagari_Regular_normal.style
    );

    // Noto Sans Devanagari bold
    doc.addFileToVFS(font_NotoSansDevanagari_Bold_bold.filename, font_NotoSansDevanagari_Bold_bold.data);
    doc.addFont(
      font_NotoSansDevanagari_Bold_bold.filename,
      font_NotoSansDevanagari_Bold_bold.name,
      font_NotoSansDevanagari_Bold_bold.style
    );

    // Noto Sans Kannada normal
    doc.addFileToVFS(font_NotoSansKannada_Regular_normal.filename, font_NotoSansKannada_Regular_normal.data);
    doc.addFont(
      font_NotoSansKannada_Regular_normal.filename,
      font_NotoSansKannada_Regular_normal.name,
      font_NotoSansKannada_Regular_normal.style
    );

    // Noto Sans Kannada bold
    doc.addFileToVFS(font_NotoSansKannada_Bold_bold.filename, font_NotoSansKannada_Bold_bold.data);
    doc.addFont(
      font_NotoSansKannada_Bold_bold.filename,
      font_NotoSansKannada_Bold_bold.name,
      font_NotoSansKannada_Bold_bold.style
    );

    // fontsRegistered = true;

    // OPTIONAL: Log success message for debugging
    // console.log("jsPDF custom fonts registered successfully.");

    // OPTIONAL: Log available fonts for debugging
    // console.log("jsPDF.API.getFontList() after manual registration:", doc.getFontList());

  } catch (error) {
    console.error("Failed to register jsPDF custom fonts:", error);
    // You might want to unset fontsRegistered to allow a retry or indicate failure
    // fontsRegistered = false;
  }
};