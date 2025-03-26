'use client';

import { askAIAboutJournals } from '@/actions/journal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon } from 'lucide-react';
import { BotMessageSquare } from 'lucide-react';
import React, { useTransition, useState, Fragment, useRef } from 'react';
import './ai-response.css';

const AskAI = ({ entryId }) => {
  const [open, setOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [questionText, setQuestionText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);

  const handleOnOpenChange = (isOpen) => {
    if (isOpen) {
      setQuestionText('');
      setQuestions([]);
      setResponses([]);
    }
    setOpen(isOpen);
  };

  const textareaRef = useRef(null);
  const contentRef = useRef(null);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleClickInput = () => {
    textareaRef.current.focus();
  };

  const handleSubmit = () => {
    if (!questionText.trim()) return;

    const newQuestions = [...questions, questionText];
    setQuestions(newQuestions);
    setQuestionText('');
    setTimeout(scrollToBottom, 100);

    startTransition(async () => {
      const res = await askAIAboutJournals(newQuestions, responses, entryId);
      setResponses((prev) => [...prev, res]);

      setTimeout(scrollToBottom, 100);
    });
  };

  const scrollToBottom = () => {
    contentRef.current.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button effect="shineHover" size="sm">
          <BotMessageSquare className="h-4 w-4 mr-2" /> Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent
        className="custom-scrollbar flex h-[85vh] max-w-4xl flex-col overflow-y-auto"
        ref={contentRef}
      >
        <DialogHeader>
          <DialogTitle>Ask AI About Your Journals</DialogTitle>
          <DialogDescription>
            Our AI can answer questions about all of your journals
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-8">
          {questions.map((question, index) => (
            <Fragment key={index}>
              <p className="ml-auto max-w-[60%] rounded-md bg-muted px-2 py-1 text-sm ">
                {question}
              </p>
              {responses[index] && (
                <p
                  className="bot-response text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: responses[index] }}
                />
              )}
            </Fragment>
          ))}
          {isPending && <p className="animate-pulse text-sm">Thinking...</p>}
        </div>

        <div
          className="mt-auto flex cursor-text flex-col rounded-lg border p-4"
          onClick={handleClickInput}
        >
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything about your journals..."
            className="placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              minHeight: '0',
              lineHeight: 'normal',
            }}
            rows={1}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          <Button className="ml-auto size-8 rounded-full">
            <ArrowUpIcon className="text-background" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AskAI;
