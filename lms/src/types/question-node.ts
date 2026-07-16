interface BaseQuestionNode {
  type: 'single-choice' | 'multiple-choice' | 'blank' | 'essay' | 'upload' | 'code';
  id: string;
  required?: boolean;
  points?: number;
}

interface SingleChoiceNode extends BaseQuestionNode {
  type: 'single-choice';
  options: Array<{
    text: string;
    correct: boolean;
  }>;
}

interface BlankNode extends BaseQuestionNode {
  type: 'blank';
  template: string;
  blanks: Array<{
    id: string;
    maxLength?: number;
    placeholder?: string;
  }>;
}