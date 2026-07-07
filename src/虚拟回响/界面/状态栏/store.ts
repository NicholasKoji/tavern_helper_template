import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(Schema, {
  type: 'message',
  message_id: getCurrentMessageId(),
});

export type StatusData = Schema;
export type AnyRecord = Record<string, unknown>;
