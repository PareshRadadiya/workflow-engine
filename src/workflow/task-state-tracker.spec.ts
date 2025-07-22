import { TaskStateTracker } from './task-state-tracker';
import { TaskDefinition } from './task.interface';

describe('TaskStateTracker', () => {
  let tracker: TaskStateTracker;

  beforeEach(() => {
    tracker = new TaskStateTracker();
  });

  describe('basic state management', () => {
    it('should be initialized with empty state', () => {
      expect(tracker.getCompletedCount()).toBe(0);
      expect(tracker.getInProgressCount()).toBe(0);
      expect(tracker.getCompletedTaskIds()).toEqual([]);
      expect(tracker.getInProgressTaskIds()).toEqual([]);
    });

    it('should mark task as in progress', () => {
      tracker.markInProgress('task1');

      expect(tracker.isInProgress('task1')).toBe(true);
      expect(tracker.getInProgressCount()).toBe(1);
      expect(tracker.getInProgressTaskIds()).toEqual(['task1']);
    });

    it('should mark task as completed', () => {
      tracker.markInProgress('task1');
      tracker.markCompleted('task1');

      expect(tracker.isCompleted('task1')).toBe(true);
      expect(tracker.isInProgress('task1')).toBe(false);
      expect(tracker.getCompletedCount()).toBe(1);
      expect(tracker.getInProgressCount()).toBe(0);
      expect(tracker.getCompletedTaskIds()).toEqual(['task1']);
    });

    it('should handle multiple tasks', () => {
      tracker.markInProgress('task1');
      tracker.markInProgress('task2');
      tracker.markCompleted('task1');

      expect(tracker.getCompletedCount()).toBe(1);
      expect(tracker.getInProgressCount()).toBe(1);
      expect(tracker.getCompletedTaskIds()).toEqual(['task1']);
      expect(tracker.getInProgressTaskIds()).toEqual(['task2']);
    });
  });

  describe('task readiness', () => {
    const simpleTask: TaskDefinition = {
      id: 'task1',
      handler: async () => 'result',
    };

    const dependentTask: TaskDefinition = {
      id: 'task2',
      dependencies: ['task1'],
      handler: async () => 'result',
    };

    it('should identify simple task as ready', () => {
      expect(tracker.isReady(simpleTask)).toBe(true);
    });

    it('should identify dependent task as not ready when dependency not completed', () => {
      expect(tracker.isReady(dependentTask)).toBe(false);
    });

    it('should identify dependent task as ready when dependency completed', () => {
      tracker.markCompleted('task1');
      expect(tracker.isReady(dependentTask)).toBe(true);
    });

    it('should identify task as not ready when in progress', () => {
      tracker.markInProgress('task1');
      expect(tracker.isReady(simpleTask)).toBe(false);
    });

    it('should identify task as not ready when completed', () => {
      tracker.markCompleted('task1');
      expect(tracker.isReady(simpleTask)).toBe(false);
    });
  });

  describe('workflow management', () => {
    const workflow: TaskDefinition[] = [
      {
        id: 'task1',
        handler: async () => 'result1',
      },
      {
        id: 'task2',
        dependencies: ['task1'],
        handler: async () => 'result2',
      },
      {
        id: 'task3',
        dependencies: ['task2'],
        handler: async () => 'result3',
      },
    ];

    it('should get pending tasks', () => {
      const pending = tracker.getPending(workflow);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('task1');
    });

    it('should get pending tasks after dependency completion', () => {
      tracker.markCompleted('task1');
      const pending = tracker.getPending(workflow);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('task2');
    });

    it('should get remaining tasks', () => {
      tracker.markCompleted('task1');
      const remaining = tracker.getRemaining(workflow);
      expect(remaining).toHaveLength(2);
      expect(remaining.map((t) => t.id)).toEqual(['task2', 'task3']);
    });

    it('should check if all tasks completed', () => {
      expect(tracker.isAllCompleted(3)).toBe(false);

      tracker.markCompleted('task1');
      expect(tracker.isAllCompleted(3)).toBe(false);

      tracker.markCompleted('task2');
      tracker.markCompleted('task3');
      expect(tracker.isAllCompleted(3)).toBe(true);
    });
  });

  describe('state summary', () => {
    it('should provide accurate state summary', () => {
      tracker.markInProgress('task1');
      tracker.markCompleted('task2');

      const summary = tracker.getStateSummary();

      expect(summary).toEqual({
        completed: 1,
        inProgress: 1,
        completedTaskIds: ['task2'],
        inProgressTaskIds: ['task1'],
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset state to initial', () => {
      tracker.markInProgress('task1');
      tracker.markCompleted('task2');

      tracker.reset();

      expect(tracker.getCompletedCount()).toBe(0);
      expect(tracker.getInProgressCount()).toBe(0);
      expect(tracker.getCompletedTaskIds()).toEqual([]);
      expect(tracker.getInProgressTaskIds()).toEqual([]);
    });
  });

  describe('complex workflow scenarios', () => {
    const complexWorkflow: TaskDefinition[] = [
      {
        id: 'fetch',
        handler: async () => 'data',
      },
      {
        id: 'validate',
        dependencies: ['fetch'],
        handler: async () => 'validated',
      },
      {
        id: 'process',
        dependencies: ['fetch'],
        handler: async () => 'processed',
      },
      {
        id: 'save',
        dependencies: ['validate', 'process'],
        handler: async () => 'saved',
      },
    ];

    it('should handle parallel execution after dependency completion', () => {
      // Initially only 'fetch' is ready
      let pending = tracker.getPending(complexWorkflow);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('fetch');

      // Complete 'fetch'
      tracker.markCompleted('fetch');

      // Now 'validate' and 'process' should be ready (parallel)
      pending = tracker.getPending(complexWorkflow);
      expect(pending).toHaveLength(2);
      expect(pending.map((t) => t.id).sort()).toEqual(['process', 'validate']);

      // Complete both parallel tasks
      tracker.markCompleted('validate');
      tracker.markCompleted('process');

      // Now 'save' should be ready
      pending = tracker.getPending(complexWorkflow);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('save');
    });

    it('should track completion progress correctly', () => {
      expect(tracker.isAllCompleted(4)).toBe(false);

      tracker.markCompleted('fetch');
      expect(tracker.getCompletedCount()).toBe(1);

      tracker.markCompleted('validate');
      tracker.markCompleted('process');
      expect(tracker.getCompletedCount()).toBe(3);

      tracker.markCompleted('save');
      expect(tracker.isAllCompleted(4)).toBe(true);
    });
  });
});
