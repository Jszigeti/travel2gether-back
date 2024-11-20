export const expiredAtDateGenerator = () => {
  const expiredAt = new Date();
  expiredAt.setMinutes(expiredAt.getMinutes() + 15);
  return expiredAt;
};
