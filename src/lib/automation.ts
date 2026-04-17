import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { JobRecord } from '../types/job';
import { InterviewPrepModule } from '../types/interview';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firestore-utils';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const ai = new GoogleGenAI({ apiKey: apiKey as string });

function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export async function triggerPostDownloadAutomation(jdUrl: string, originalResumeText: string, atsMatchScore: number = 0) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const isUrl = isValidUrl(jdUrl);
    const jobId = crypto.randomUUID();
    const prepId = crypto.randomUUID();

    // 1. Initial Records (Placeholders)
    const initialJob: JobRecord = {
      id: jobId,
      userId: user.uid,
      company: 'Processing...',
      role: 'Analyzing Job...',
      jobLink: jdUrl,
      dateApplied: new Date().toISOString().split('T')[0],
      location: '...',
      workMode: 'Unknown',
      salary: '...',
      skillsRequired: [],
      status: 'Applied',
      jobDescriptionSnapshot: jdUrl,
      keywordsExtracted: [],
      atsMatchScore: atsMatchScore,
      interviewPrepId: prepId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialPrep: InterviewPrepModule = {
      id: prepId,
      userId: user.uid,
      jobId: jobId,
      companyName: 'Processing...',
      roleName: 'Analyzing Job...',
      dateCreated: new Date().toISOString(),
      hrQuestions: [],
      technicalQuestions: [],
      assessmentPrep: [],
      companyPrep: { about: '', focusAreas: [] },
      resumeQuestions: [],
      aceThisJob: { focusAreas: [], roadmap: [], tips: [] },
      status: 'generating'
    };

    try {
      await Promise.all([
        setDoc(doc(db, 'jobs', jobId), initialJob),
        setDoc(doc(db, 'interviewPreps', prepId), initialPrep)
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `jobs/${jobId} or interviewPreps/${prepId}`);
    }

    // 2. Combined AI Call for Extraction and Prep
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: isUrl ? `Job URL: ${jdUrl}` : `Job Description Text:\n${jdUrl}` },
          { text: `Candidate Resume: ${originalResumeText.substring(0, 5000)}` },
          { text: isUrl ? `Please extract the job details from the URL.` : `Please extract the job details from the provided text.` }
        ]
      },
      config: {
        tools: isUrl ? [{ urlContext: {} }] : [],
        systemInstruction: `You are an expert recruiter and career coach. 
        TASK:
        1. Extract job details (Company, Role, Location, WorkMode, Salary, Skills) from the provided Job Description text or URL.
        2. If the input is raw text, look for common patterns like "Company:", "Role:", "About Us", etc., to identify the organization and position.
        3. Analyze the candidate's resume against the job requirements.
        4. Generate 5 behavioral interview questions specifically tailored to the candidate's background and the job role. For each, provide a 'bestAnswer' using the STAR method and 'tips' for delivery.
        5. Generate 5 technical interview questions that test the specific skills required for this role, tailored to the candidate's experience level. For each, provide a 'bestAnswer' and 'tips'.
        6. Provide a brief 'about' section for the company and 3 'focusAreas' for the interview.
        
        Output strictly as JSON.`,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            roleName: { type: Type.STRING },
            location: { type: Type.STRING },
            workMode: { type: Type.STRING, enum: ['Remote', 'Hybrid', 'Onsite', 'Unknown'] },
            salary: { type: Type.STRING },
            skillsRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
            hrQuestions: {
              type: Type.ARRAY,
              minItems: 5,
              maxItems: 5,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  bestAnswer: { type: Type.STRING },
                  tips: { type: Type.STRING }
                },
                required: ['question', 'bestAnswer', 'tips']
              }
            },
            technicalQuestions: {
              type: Type.ARRAY,
              minItems: 5,
              maxItems: 5,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  bestAnswer: { type: Type.STRING },
                  tips: { type: Type.STRING }
                },
                required: ['question', 'bestAnswer', 'tips']
              }
            },
            companyPrep: {
              type: Type.OBJECT,
              properties: {
                about: { type: Type.STRING },
                focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['about', 'focusAreas']
            }
          },
          required: ['companyName', 'roleName', 'location', 'workMode', 'salary', 'skillsRequired', 'hrQuestions', 'technicalQuestions', 'companyPrep']
        }
      }
    });

    let data: any = {};
    if (response.text) {
      try {
        data = JSON.parse(response.text);
      } catch (e) {
        console.error("Failed to parse AI response:", response.text);
      }
    }

    const updatedJob: JobRecord = {
      ...initialJob,
      company: data.companyName || 'Unknown Company',
      role: data.roleName || 'Target Role',
      location: data.location || 'Unknown',
      workMode: data.workMode || 'Unknown',
      salary: data.salary || 'Not Specified',
      skillsRequired: data.skillsRequired || [],
      keywordsExtracted: data.skillsRequired || [],
      updatedAt: new Date().toISOString(),
    };

    const updatedPrep: InterviewPrepModule = {
      ...initialPrep,
      companyName: updatedJob.company,
      roleName: updatedJob.role,
      hrQuestions: data.hrQuestions || [],
      technicalQuestions: data.technicalQuestions || [],
      companyPrep: data.companyPrep || { about: '', focusAreas: [] },
      status: 'completed',
      location: updatedJob.location,
      workMode: updatedJob.workMode,
      salary: updatedJob.salary,
      skillsRequired: updatedJob.skillsRequired
    };

    try {
      await Promise.all([
        setDoc(doc(db, 'jobs', jobId), updatedJob),
        setDoc(doc(db, 'interviewPreps', prepId), updatedPrep)
      ]);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${jobId} or interviewPreps/${prepId}`);
    }

    return updatedJob;
  } catch (error) {
    console.error("Automation failed:", error);
    throw error;
  }
}

