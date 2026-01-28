import React, { useState } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";

const CreatePoll = ({ onClose, onSend }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSend = () => {
  if (!question.trim()) return alert("Enter question");
  if (options.filter(o => o.trim()).length < 2)
    return alert("At least 2 options required");

  const formattedOptions = options
    .filter(opt => opt.trim())
    .map(opt => ({
      text: opt,
      votes: [],
    }));

  onSend({
    question,
    options: formattedOptions, // ✅ IMPORTANT
    allowMultiple,
  });
};


  return (
    <div className="fixed inset-0 bg-[#0b141a] z-50 flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center p-4 bg-[#202c33] text-white">
        <button onClick={onClose} className="mr-3">
          <FaArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">Create poll</h2>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 overflow-y-auto">

        {/* QUESTION */}
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question"
          className="w-full p-3 rounded bg-[#202c33] text-white mb-4 outline-none"
        />

        {/* OPTIONS */}
        {options.map((opt, i) => (
          <input
            key={i}
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            className="w-full p-3 rounded bg-[#202c33] text-white mb-2 outline-none"
          />
        ))}

        {/* ADD OPTION */}
        <button
          onClick={addOption}
          className="flex items-center text-green-400 mt-2"
        >
          <FaPlus className="mr-2" /> Add option
        </button>

        {/* MULTIPLE ANSWERS */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-white">Allow multiple answers</span>
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={() => setAllowMultiple(!allowMultiple)}
            className="w-5 h-5"
          />
        </div>
      </div>

      {/* SEND */}
      <div className="p-4">
        <button
          onClick={handleSend}
          className="w-full bg-green-500 text-white py-3 rounded-full font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CreatePoll;
