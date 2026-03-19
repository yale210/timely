import { useState, type FormEvent } from "react";
import { type Assessment, type AssessmentDetail } from "@/types/assessment";

interface AssessmentFormProps {
  onSubmit: (assessment: Assessment) => void;
}

const assessmentTypeOptions = [
    "COURSEWORK",
    "EXAM",
    "QUIZ",
    "PRESENTATION",
    "PRACTICAL",
    "FORMATIVE",
    "SUMMATIVE",
    "OTHER"
];

const AssessmentForm = ({ onSubmit }: AssessmentFormProps) => {
  const[title, setTitle] = useState("");
  const[module, setModule] = useState("");
  const[assessmentType, setAssessmentType] = useState("SUMMATIVE");
  const[dueDate, setDueDate] = useState("");
  const[location, setLocation] = useState("");
  const[startTime, setStartTime] = useState("");
  const[endTime, setEndTime] = useState("");
  
  const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      setHasSubmitted(true);
      if (hasBlockingErrors || !hasChanges) return;
  
      const data = buildSubmission();
      onSubmit(data);
    };