export const Schema = z.object({
  san值: z.coerce.number().transform(value => _.clamp(value, 0, 100)).prefault(100),
});
export type Schema = z.output<typeof Schema>;
