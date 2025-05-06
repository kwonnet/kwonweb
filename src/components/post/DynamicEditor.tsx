import dynamic from 'next/dynamic';
import { createEditorStateWithText } from '@draft-js-plugins/editor';

// Dynamically import Editor with SSR turned off
const Editor = dynamic(() => import('@draft-js-plugins/editor').then(mod => mod.default), { ssr: false });

export { Editor, createEditorStateWithText };
