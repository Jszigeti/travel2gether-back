export const addFilter = (
  filters: Object[],
  field: string,
  values: string[],
  column: string,
) => {
  if (values?.length) {
    filters.push({
      OR: values.map((value) => ({
        [field]: {
          some: { [column]: value },
        },
      })),
    });
  }
};
