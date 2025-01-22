export const expiredAtDateGenerator = () => {
  const expiredAt = new Date();
  expiredAt.setHours(expiredAt.getHours() + 24);
  return expiredAt;
};
