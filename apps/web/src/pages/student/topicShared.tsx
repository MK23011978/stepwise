// Helpers shared by the roadmap / learn / progress pages (v1: tierOn, topicName, bindTopicTest).
import { useSession } from '../../state/session';
import { useLearningActions } from '../../features/actions';

/** Whether the subject has Foundation/Higher tiers (v1 `tierOn`). */
export function useTierOn() {
  const s = useSession();
  return (subject: string) => !!s.subjectInfo(subject)?.tiers;
}

/** Starts the 15-question, 25-minute topic test for a topic (v1 `bindTopicTest`). */
export function useTopicTest() {
  const s = useSession(); const { startExam } = useLearningActions();
  return (topicId: string) => {
    const name = s.cur?.topics.find((t) => t.id === topicId)?.name || topicId;
    return startExam(`topic:${topicId}`, `${name} — Topic Test`, 15, 25);
  };
}
