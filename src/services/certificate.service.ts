import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Certificate } from '../models';
import { v4 as uuid } from 'uuid';
import { Types } from 'mongoose';
import { config } from '../config/variables.config';
import { cacheData } from '../services/cache.service';

export const generateCertificate = async(studentId: Types.ObjectId, courseId: Types.ObjectId, studentName: string, courseName: string, completionDate: string) => {
    try {   
        const cert_id = uuid();
        const templatePath = path.join(__dirname, '..', 'assets', 'template.pdf');
        const templateBytes = await fs.promises.readFile(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const page = pdfDoc.getPages()[0];

        const fontSize = 24;
        let yPosition = 380; 

        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const HelveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const nameWidth = timesRomanFont.widthOfTextAtSize(studentName, 36);
        const courseWidth = HelveticaFont.widthOfTextAtSize(`For successfully completing the ${courseName}`, 18);
        const dateWidth = HelveticaFont.widthOfTextAtSize(`Course on ${completionDate}`, 18);

        const pageWidth = page.getWidth();
        const nameX = (pageWidth - nameWidth) / 2;
        const courseX = (pageWidth - courseWidth) / 2;
        const dateX = (pageWidth - dateWidth) / 2;

        page.drawText(`${studentName}`, {
            x: nameX,
            y: yPosition,
            size: 42,
            font: timesRomanFont,
            color: rgb(0.894, 0.647, 0.102), 
        });
        yPosition -= fontSize + 20; 
        
        page.drawText(`For successfully completing the ${courseName}`, {
            x: courseX,
            y: yPosition,
            size: 18,
            font: HelveticaFont,
            color: rgb(0, 0, 0),
        });
        yPosition -= fontSize + 5; 

        page.drawText(`course on ${completionDate}`, {
            x: dateX,
            y: yPosition,
            size: 18,
            font: HelveticaFont,
            color: rgb(0, 0, 0),
        });

        yPosition -= fontSize + 220;

        page.drawText(`${cert_id}`, {
            x: 465,
            y: yPosition,
            size: 14,
            color: rgb(0, 0, 0),
        });

        // saving to local
        const certificateDir = path.resolve(config.certificateStoragePath, studentId.toString(), courseId.toString());
        if (!fs.existsSync(certificateDir)) {
            fs.mkdirSync(certificateDir, { recursive: true });
        }

        const filename = `${cert_id}.pdf`;
        const filePath = path.join(certificateDir, filename);

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        fs.writeFile(filePath, pdfBytes, (err)=>{
            if(err) throw err;
        });
        await Certificate.create({
            user: studentId,
            course: courseId,
            certificateId: cert_id,
            issuedAt: completionDate
        });
        
    } catch (ex) {
        console.log(ex);
    }
}

export const getCertificatesForUser = async (userId: string) => {
    const key = `certificates:${userId}`;
    return cacheData(key, async () => {
        return await Certificate.find({ user: userId }).populate('course', 'name description');
    });
};
