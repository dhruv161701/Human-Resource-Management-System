import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

class AzureOpenAIService:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AzureOpenAIService, cls).__new__(cls)
            try:
                cls._client = AzureOpenAI(
                    api_key=os.getenv('AZURE_OPENAI_API_KEY'),
                    api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-12-01-preview'),
                    azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
                )
                print("Azure OpenAI client initialized successfully!")
            except Exception as e:
                print(f"Failed to initialize Azure OpenAI client: {e}")
                cls._client = None
        return cls._instance

    @property
    def client(self):
        return self._client

    def chat_completion(self, messages, max_tokens=1000, temperature=0.7):
        """
        Send a chat completion request to Azure OpenAI
        """
        if not self._client:
            return {"error": "Azure OpenAI client not initialized"}
        
        try:
            deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o-mini')
            
            response = self._client.chat.completions.create(
                model=deployment_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            print(f"Azure OpenAI chat completion error: {e}")
            return {"error": str(e)}

    def get_hr_assistant_response(self, user_query, context_data, role='employee'):
        """
        Get HR assistant response based on user role and context
        """
        system_prompts = {
            'employee': """You are an HR assistant for employees at Dayflow HRMS. You help employees with:
- Understanding their attendance records and patterns
- Leave balance and leave policies
- Salary structure and payslip queries
- Company HR policies
- General HR-related questions

You have access to the employee's personal data provided in the context. Be helpful, professional, and concise.
If you don't have specific information, provide general guidance and suggest contacting HR directly.""",

            'manager': """You are an HR assistant for managers at Dayflow HRMS. You help managers with:
- Team attendance analysis and patterns
- Leave request management and approval guidance
- Timesheet review and approval
- Team performance insights
- HR policy guidance for team management

You have access to team data provided in the context. Provide actionable insights and recommendations.
Help managers make informed decisions about their team.""",

            'admin': """You are an HR analytics assistant for administrators at Dayflow HRMS. You help admins with:
- Organization-wide attendance analysis
- Leave pattern analysis across departments
- Payroll insights and anomalies
- Employee engagement indicators
- HR policy recommendations
- Workforce planning insights

You have access to organization-wide data provided in the context. Provide strategic insights,
identify patterns, and give actionable recommendations for HR management."""
        }

        context_str = self._format_context(context_data, role)
        
        messages = [
            {"role": "system", "content": system_prompts.get(role, system_prompts['employee'])},
            {"role": "system", "content": f"Here is the relevant data context:\n{context_str}"},
            {"role": "user", "content": user_query}
        ]
        
        return self.chat_completion(messages, max_tokens=1500, temperature=0.7)

    def generate_insights(self, data, insight_type='general'):
        """
        Generate AI insights from HR data
        """
        prompts = {
            'attendance': """Analyze the attendance data and provide:
1. Key patterns and anomalies
2. Employees or departments with concerning attendance
3. Recommendations for improvement
Format your response with clear sections.""",

            'leave': """Analyze the leave data and provide:
1. Leave utilization patterns
2. Peak leave periods
3. Potential issues (excessive sick leave, etc.)
4. Policy recommendations
Format your response with clear sections.""",

            'payroll': """Analyze the payroll data and provide:
1. Salary distribution insights
2. Any anomalies or concerns
3. Budget optimization suggestions
Format your response with clear sections.""",

            'general': """Analyze the HR data and provide:
1. Key insights and patterns
2. Areas of concern
3. Actionable recommendations
4. Strategic suggestions for HR improvement
Format your response with clear sections."""
        }

        data_str = self._format_data_for_insights(data)
        
        messages = [
            {"role": "system", "content": "You are an HR analytics expert. Analyze the provided data and give actionable insights."},
            {"role": "user", "content": f"{prompts.get(insight_type, prompts['general'])}\n\nData:\n{data_str}"}
        ]
        
        return self.chat_completion(messages, max_tokens=2000, temperature=0.5)

    def _format_context(self, context_data, role):
        """Format context data for the AI prompt"""
        context_parts = []
        
        if role == 'employee':
            if 'profile' in context_data:
                p = context_data['profile']
                context_parts.append(f"Employee: {p.get('name', 'N/A')}, ID: {p.get('employee_id', 'N/A')}")
                context_parts.append(f"Department: {p.get('department', 'N/A')}, Job Title: {p.get('job_title', 'N/A')}")
            
            if 'salary' in context_data:
                s = context_data['salary']
                context_parts.append(f"Salary - Basic: ₹{s.get('basic', 0)}, HRA: ₹{s.get('hra', 0)}, Net: ₹{s.get('net', 0)}")
            
            if 'leave_balance' in context_data:
                lb = context_data['leave_balance']
                context_parts.append(f"Leave Balance - Paid: {lb.get('paid_leave', 0)}, Sick: {lb.get('sick_leave', 0)}, Unpaid: {lb.get('unpaid_leave', 0)}")
            
            if 'attendance' in context_data:
                att = context_data['attendance']
                context_parts.append(f"Recent Attendance: {len(att)} records")
                present = sum(1 for a in att if a.get('status') == 'Present')
                context_parts.append(f"Present days: {present}/{len(att)}")
            
            if 'leaves' in context_data:
                leaves = context_data['leaves']
                context_parts.append(f"Leave Requests: {len(leaves)} total")
                pending = sum(1 for l in leaves if l.get('status') == 'Pending')
                context_parts.append(f"Pending leaves: {pending}")

        elif role == 'manager':
            if 'team_members' in context_data:
                context_parts.append(f"Team Size: {len(context_data['team_members'])} employees")
            
            if 'team_attendance' in context_data:
                att = context_data['team_attendance']
                context_parts.append(f"Team Attendance Records: {len(att)}")
            
            if 'pending_leaves' in context_data:
                context_parts.append(f"Pending Leave Requests: {len(context_data['pending_leaves'])}")
            
            if 'pending_timesheets' in context_data:
                context_parts.append(f"Pending Timesheets: {len(context_data['pending_timesheets'])}")

        elif role == 'admin':
            if 'total_employees' in context_data:
                context_parts.append(f"Total Employees: {context_data['total_employees']}")
            
            if 'departments' in context_data:
                context_parts.append(f"Departments: {', '.join(context_data['departments'])}")
            
            if 'attendance_summary' in context_data:
                att = context_data['attendance_summary']
                context_parts.append(f"Attendance - Present: {att.get('present', 0)}, Absent: {att.get('absent', 0)}")
            
            if 'leave_summary' in context_data:
                ls = context_data['leave_summary']
                context_parts.append(f"Leaves - Pending: {ls.get('pending', 0)}, Approved: {ls.get('approved', 0)}")
            
            if 'payroll_summary' in context_data:
                ps = context_data['payroll_summary']
                context_parts.append(f"Monthly Payroll: ₹{ps.get('total', 0)}")

        return "\n".join(context_parts) if context_parts else "No specific context available."

    def _format_data_for_insights(self, data):
        """Format data for insights generation"""
        if isinstance(data, dict):
            parts = []
            for key, value in data.items():
                if isinstance(value, list):
                    parts.append(f"{key}: {len(value)} records")
                    if value and len(value) <= 10:
                        for item in value[:10]:
                            parts.append(f"  - {item}")
                else:
                    parts.append(f"{key}: {value}")
            return "\n".join(parts)
        return str(data)


# Singleton instance
azure_openai_service = AzureOpenAIService()
