import { useState, useEffect } from 'react';
import api from '../../services/api';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  includesCalendarInvite: boolean;
}

interface TemplateSelectorProps {
  onSelect: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
}

export const TemplateSelector = ({ onSelect, selectedTemplateId }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/mail/templates');
        setTemplates(response.data);
      } catch (error) {
        console.error('Failed to fetch templates', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-slate-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center justify-between">
          <span className={selectedTemplate ? 'text-slate-900' : 'text-slate-500'}>
            {selectedTemplate ? selectedTemplate.name : 'Select a template...'}
          </span>
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Loading templates...</div>
          ) : (
            Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50 sticky top-0">
                  {category}
                </div>
                {categoryTemplates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      onSelect(template);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between ${
                      template.id === selectedTemplateId ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div>
                      <span className="font-medium">{template.name}</span>
                      {template.includesCalendarInvite && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          📅 Calendar
                        </span>
                      )}
                    </div>
                    {template.id === selectedTemplateId && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
