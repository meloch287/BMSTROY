'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Edit3, User, Save, FileText, ChevronDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const DEFAULT_TEMPLATE = `# ДОГОВОР ПОДРЯДА № {NUMBER}

**г. Москва** {DATE}

ООО «БМСтрой», именуемое в дальнейшем «Подрядчик», в лице {REPRESENTATIVE_NAME}, действующего на основании Устава, с одной стороны, и {CLIENT_NAME}, именуемый(ая) в дальнейшем «Заказчик», с другой стороны, совместно именуемые «Стороны», заключили настоящий договор в соответствии со статьями 702, 703, 708, 709, 711, 721, 723 ГК РФ.

### 1. Предмет договора

1.1. По договору подряда Подрядчик обязуется выполнить по заданию Заказчика определенную работу и сдать ее результат заказчику, а Заказчик обязуется принять результат работы и оплатить его (ст. 702 ГК РФ).

1.2. Предметом договора являются выполнение ремонтных работ по адресу: {ADDRESS}.

1.3. Объем и содержание работ определяются сметой (Приложение №1), являющейся неотъемлемой частью настоящего договора (ст. 703 ГК РФ).

### 2. Стоимость и порядок расчетов

2.1. Общая стоимость работ составляет {TOTAL_SUM} рублей (ст. 709 ГК РФ).

2.2. Оплата производится:
- аванс — {ADVANCE_SUM}% от стоимости работ в течение {DAYS_ADVANCE} дней с даты подписания договора;
- оставшаяся сумма — в течение {DAYS_AFTER_ACCEPT} дней после подписания акта приема-передачи выполненных работ (ст. 711 ГК РФ).

### 3. Сроки выполнения работ

3.1. Начало работ: {START_DATE}.
3.2. Окончание работ: {END_DATE}.
3.3. Стороны обязаны соблюдать сроки, установленные договором (ст. 708 ГК РФ).

### 4. Качество работы

4.1. Работы выполняются с соблюдением требований законодательства и стандартов (ст. 721 ГК РФ).
4.2. Подрядчик несет ответственность за качество выполненной работы (ст. 723 ГК РФ).

### 5. Права и обязанности сторон

5.1. Подрядчик обязан:
- выполнить работы качественно и в срок;
- уведомить Заказчика о препятствиях в выполнении работ.

5.2. Заказчик обязан:
- предоставить доступ к объекту;
- своевременно произвести оплату;
- принять и подписать акт приема-передачи работ (ст. 702 ГК РФ).

### 6. Ответственность сторон

6.1. За неисполнение или ненадлежащее исполнение обязательств стороны несут ответственность в соответствии с законодательством РФ (ст. 723, 711 ГК РФ).

6.2. В случае просрочки оплаты Заказчиком Подрядчик вправе начислить пеню в размере 0,1% от суммы задолженности за каждый день просрочки (ст. 395 ГК РФ).

6.3. В случае выявления недостатков Заказчик вправе потребовать их безвозмездного устранения в разумный срок (ст. 723 ГК РФ).

### 7. Приемка выполненных работ

7.1. По завершении работ Подрядчик передает Заказчику акт приема-передачи выполненных работ (ст. 720 ГК РФ).

7.2. Заказчик обязан в течение {ACCEPT_DAYS} дней подписать акт или предоставить мотивированный отказ.

7.3. При отсутствии возражений в указанный срок работы считаются принятыми (ст. 720 ГК РФ).

### 8. Форс-мажор

8.1. Стороны освобождаются от ответственности за неисполнение обязательств при наступлении форс-мажорных обстоятельств (ст. 401 ГК РФ).

### 9. Заключительные положения

9.1. Все изменения и дополнения оформляются дополнительными соглашениями.
9.2. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу.

### 10. Адреса и реквизиты сторон

**Подрядчик:**
ООО «БМСтрой»
ИНН 7700000000, КПП 770001001
Юр. адрес: 115000, г. Москва, ул. Примерная, д. 1
Р/с: 40702810900000000001 в ПАО «Банк», г. Москва
БИК: 044525000
Директор: {REPRESENTATIVE_NAME}

**Заказчик:**
{CLIENT_NAME}
Паспорт: {PASSPORT}, выдан {PASSPORT_ISSUER}, дата выдачи {PASSPORT_DATE}
Адрес: {CLIENT_ADDRESS}
Телефон: {CLIENT_PHONE}

---

**Подписи сторон:**

_____________________ /Подрядчик/

_____________________ /Заказчик/
`;

export default function AdminDocuments() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<any>({ id: 1, name: 'Договор подряда', content: DEFAULT_TEMPLATE });
  const [previewData, setPreviewData] = useState<Record<string, string>>({
    NUMBER: '102/25',
    DATE: new Date().toLocaleDateString('ru-RU'),
    REPRESENTATIVE_NAME: 'Генерального директора Петрова П.П.',
    CLIENT_NAME: 'Иванов Иван Иванович',
    ADDRESS: 'г. Москва, ул. Ленина 1, кв. 15',
    TOTAL_SUM: '1 500 000',
    ADVANCE_SUM: '30',
    DAYS_ADVANCE: '3',
    DAYS_AFTER_ACCEPT: '5',
    START_DATE: '01.12.2025',
    END_DATE: '01.03.2026',
    ACCEPT_DAYS: '5',
    PASSPORT: '4500 123456',
    PASSPORT_ISSUER: 'ОВД г. Москвы',
    PASSPORT_DATE: '01.01.2020',
    CLIENT_ADDRESS: 'г. Москва, ул. Примерная, д. 10, кв. 5',
    CLIENT_PHONE: '+7 (999) 123-45-67'
  });
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTemplate = localStorage.getItem('documentTemplate');
    if (savedTemplate) {
      try {
        const parsed = JSON.parse(savedTemplate);
        setActiveTemplate(parsed);
        setTemplates([parsed]);
        return;
      } catch {}
    }
    
    fetch('/api/documents').then(res => res.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        setActiveTemplate(data[0]);
      } else {
        setTemplates([{ id: 1, name: 'Договор подряда', content: DEFAULT_TEMPLATE }]);
      }
    }).catch(() => {
      setTemplates([{ id: 1, name: 'Договор подряда', content: DEFAULT_TEMPLATE }]);
    });
  }, []);

  useEffect(() => {
    if (activeTemplate?.content) {
      let content = activeTemplate.content;
      Object.entries(previewData).forEach(([key, value]) => {
        content = content.split(`{${key}}`).join(value);
      });
      setGeneratedDoc(content);
    }
  }, [activeTemplate, previewData]);

  const saveTemplate = async () => {
    setSaving(true);
    localStorage.setItem('documentTemplate', JSON.stringify(activeTemplate));
    try {
      await fetch('/api/documents', { 
        method: 'POST', 
        body: JSON.stringify({ id: activeTemplate.id, name: activeTemplate.name, content: activeTemplate.content }) 
      });
    } catch {}
    setTemplates(prev => prev.map(t => t.id === activeTemplate.id ? activeTemplate : t));
    setSaving(false);
    alert('Шаблон сохранён!');
  };

  const renderMarkdown = (text: string, forDocx = false) => {
    const lines = text.split('\n');
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Headers
      if (line.startsWith('### ')) {
        result.push(`<h3 style="font-size:14pt;font-weight:bold;margin:20px 0 10px;">${line.slice(4)}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        result.push(`<h2 style="font-size:16pt;font-weight:bold;margin:25px 0 15px;">${line.slice(3)}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        result.push(`<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:20px;">${line.slice(2)}</h1>`);
        continue;
      }
      
      // HR
      if (line.trim() === '---') {
        result.push('<hr style="margin:30px 0;border:none;border-top:1px solid #000;"/>');
        continue;
      }
      
      // List items
      if (line.startsWith('- ')) {
        result.push(`<p style="margin:5px 0 5px 30px;">• ${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`);
        continue;
      }
      
      // Numbered items (1.1. text)
      const numMatch = line.match(/^(\d+\.\d+\.?)\s+(.*)$/);
      if (numMatch) {
        result.push(`<p style="margin:8px 0;"><strong>${numMatch[1]}</strong> ${numMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`);
        continue;
      }
      
      // Empty line = paragraph break
      if (line.trim() === '') {
        if (!forDocx) result.push('<br/>');
        continue;
      }
      
      // Regular text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      result.push(`<p style="margin:8px 0;">${line}</p>`);
    }
    
    return result.join('\n');
  };

  const getPlainText = () => {
    return generatedDoc
      .replace(/^#{1,3} /gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^- /gm, '• ')
      .replace(/---/g, '─'.repeat(50));
  };

  const downloadAsDocx = async () => {
    setDownloading(true);
    setShowDownloadMenu(false);
    
    try {
      const lines = generatedDoc.split('\n');
      const children: Paragraph[] = [];
      
      for (const line of lines) {
        // Title (# )
        if (line.startsWith('# ')) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line.slice(2), bold: true, size: 32, font: 'Times New Roman' })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }));
          continue;
        }
        
        // Section headers (### )
        if (line.startsWith('### ')) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line.slice(4), bold: true, size: 28, font: 'Times New Roman' })],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 150 }
          }));
          continue;
        }
        
        // HR (---)
        if (line.trim() === '---') {
          children.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
            spacing: { before: 300, after: 300 }
          }));
          continue;
        }
        
        // List items (- )
        if (line.startsWith('- ')) {
          const text = line.slice(2);
          children.push(new Paragraph({
            children: parseTextRuns(text),
            bullet: { level: 0 },
            spacing: { after: 100 }
          }));
          continue;
        }
        
        // Numbered items (1.1. text)
        const numMatch = line.match(/^(\d+\.\d+\.?)\s+(.*)$/);
        if (numMatch) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: numMatch[1] + ' ', bold: true, size: 24, font: 'Times New Roman' }),
              ...parseTextRuns(numMatch[2])
            ],
            spacing: { after: 100 },
            alignment: AlignmentType.JUSTIFIED
          }));
          continue;
        }
        
        // Empty line
        if (line.trim() === '') {
          children.push(new Paragraph({ spacing: { after: 100 } }));
          continue;
        }
        
        // Regular text
        children.push(new Paragraph({
          children: parseTextRuns(line),
          spacing: { after: 100 },
          alignment: AlignmentType.JUSTIFIED
        }));
      }
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } // ~2cm in twips
            }
          },
          children
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Договор_${previewData.NUMBER.replace('/', '-')}.docx`);
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании DOCX');
    }
    setDownloading(false);
  };
  
  // Helper to parse **bold** text
  const parseTextRuns = (text: string): TextRun[] => {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 24, font: 'Times New Roman' }));
      } else if (part) {
        runs.push(new TextRun({ text: part, size: 24, font: 'Times New Roman' }));
      }
    }
    
    return runs;
  };

  const downloadAsPdf = async () => {
    setDownloading(true);
    setShowDownloadMenu(false);
    
    try {
      // Create a temporary container with proper A4 sizing
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 210mm;
        padding: 20mm;
        background: white;
        font-family: 'Times New Roman', serif;
        font-size: 14pt;
        line-height: 1.6;
        color: black;
      `;
      tempDiv.innerHTML = renderMarkdown(generatedDoc);
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: 794 // A4 width in pixels at 96dpi
      });
      
      document.body.removeChild(tempDiv);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // top margin
      
      // First page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
      
      // Additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = 10 - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`Договор_${previewData.NUMBER.replace('/', '-')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании PDF');
    }
    setDownloading(false);
  };

  const variableLabels: Record<string, string> = {
    NUMBER: 'Номер договора',
    DATE: 'Дата договора',
    REPRESENTATIVE_NAME: 'Представитель подрядчика',
    CLIENT_NAME: 'ФИО заказчика',
    ADDRESS: 'Адрес объекта',
    TOTAL_SUM: 'Сумма договора',
    ADVANCE_SUM: 'Аванс (%)',
    DAYS_ADVANCE: 'Дней на аванс',
    DAYS_AFTER_ACCEPT: 'Дней на оплату',
    START_DATE: 'Дата начала',
    END_DATE: 'Дата окончания',
    ACCEPT_DAYS: 'Дней на приёмку',
    PASSPORT: 'Паспорт',
    PASSPORT_ISSUER: 'Кем выдан',
    PASSPORT_DATE: 'Дата выдачи',
    CLIENT_ADDRESS: 'Адрес заказчика',
    CLIENT_PHONE: 'Телефон заказчика'
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Генератор Документов</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Edit3 size={18}/> Редактор шаблона</h3>
            <textarea 
              value={activeTemplate?.content || ''}
              onChange={e => setActiveTemplate({...activeTemplate, content: e.target.value})}
              className="w-full h-[350px] bg-[#020617] border border-white/10 p-4 rounded-xl text-white font-mono text-xs resize-none leading-relaxed outline-none focus:border-brand-green"
            />
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Переменные:</p>
              <div className="flex gap-1 flex-wrap">
                {Object.keys(previewData).map(key => (
                  <span key={key} 
                    onClick={() => setActiveTemplate({...activeTemplate, content: (activeTemplate?.content || '') + `{${key}}`})}
                    className="text-[10px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded cursor-pointer hover:bg-brand-green/30"
                  >
                    {`{${key}}`}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={saveTemplate} disabled={saving} className="mt-4 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50">
              <Save size={16}/> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>

          <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><User size={18}/> Данные для подстановки</h3>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(previewData).map(([key, value]) => (
                <div key={key}>
                  <label className="text-[10px] text-gray-500 block mb-1">{variableLabels[key] || key}</label>
                  <input 
                    value={value} 
                    onChange={e => setPreviewData({...previewData, [key]: e.target.value})} 
                    className="w-full bg-[#020617] border border-white/10 p-2 rounded text-white text-xs outline-none focus:border-brand-green"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white text-black p-6 rounded-xl shadow-2xl min-h-[700px] max-h-[900px] overflow-y-auto relative">
          <div className="sticky top-0 bg-white pb-4 mb-4 border-b z-10">
            <div className="relative inline-block">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                disabled={downloading}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-lg text-sm disabled:opacity-50"
              >
                {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} 
                {downloading ? 'Создание...' : 'Скачать'} 
                {!downloading && <ChevronDown size={14}/>}
              </button>
              {showDownloadMenu && !downloading && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border overflow-hidden z-20">
                  <button onClick={downloadAsPdf} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 text-sm whitespace-nowrap">
                    <FileText size={14} className="text-red-500"/> Скачать PDF
                  </button>
                  <button onClick={downloadAsDocx} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 border-t text-sm whitespace-nowrap">
                    <FileText size={14} className="text-blue-500"/> Скачать DOCX
                  </button>
                </div>
              )}
            </div>
          </div>
          <div 
            ref={previewRef}
            className="leading-relaxed p-4"
            style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt' }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedDoc) }}
          />
        </div>
      </div>
    </div>
  );
}