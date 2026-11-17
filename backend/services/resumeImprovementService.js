const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const improveResumeWithAI = async (resume, job = null) => {

    const jobInformation = job
        ? `
JOB INFORMATION:

Job Title:
${job.title || "Not provided"}

Company:
${job.companyName || "Not provided"}

Job Description:
${job.description || "Not provided"}

Required Skills:
${job.requiredSkills?.join(", ") || "Not provided"}

Preferred Skills:
${job.preferredSkills?.join(", ") || "Not provided"}

Experience Required:
${job.experienceRequired || "Not provided"}

Location:
${job.location || "Not provided"}
`
        : `
No specific job was provided.

Analyze the resume for general ATS compatibility and
software-development job applications.
`;


    const prompt = `
You are TalentIQ, an AI-powered resume and ATS optimization system.

Analyze the candidate's resume and provide useful,
realistic recommendations.

CANDIDATE RESUME:

Professional Summary:
${resume.professionalSummary || "Not provided"}

Skills:
${resume.skills?.join(", ") || "Not provided"}

Education:
${JSON.stringify(resume.education || [])}

Experience:
${JSON.stringify(resume.experience || [])}

Projects:
${JSON.stringify(resume.projects || [])}

Certifications:
${JSON.stringify(resume.certifications || [])}

Achievements:
${JSON.stringify(resume.achievements || [])}

Languages:
${resume.languages?.join(", ") || "Not provided"}

${jobInformation}


Analyze the resume for:

1. ATS compatibility
2. Relevant skills
3. Missing keywords
4. Professional summary quality
5. Project descriptions
6. Experience descriptions
7. Technical skills
8. Overall resume quality


Return ONLY valid JSON in exactly this format:

{
    "atsScore": 0,
    "overallScore": 0,
    "strengths": [],
    "weakSections": [],
    "missingKeywords": [],
    "missingSkills": [],
    "summarySuggestion": "",
    "projectSuggestions": [],
    "experienceSuggestions": [],
    "skillSuggestions": [],
    "generalSuggestions": []
}


Rules:

- atsScore must be between 0 and 100.
- overallScore must be between 0 and 100.
- Do not invent candidate experience.
- Do not claim the candidate has skills that are not present.
- Missing keywords should be relevant to the target job when a job is provided.
- Suggestions must be actionable.
- The improved summary must remain truthful to the candidate's information.
`;


    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: prompt,
    });


    const result = response.output_text;


    try {

        return JSON.parse(result);

    } catch (error) {

        console.error(
            "AI Resume Improvement JSON Error:",
            error
        );

        console.error(
            "AI Response:",
            result
        );

        throw new Error(
            "AI returned invalid resume improvement data"
        );
    }
};


module.exports = {
    improveResumeWithAI,
};