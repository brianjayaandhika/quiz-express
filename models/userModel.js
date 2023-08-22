import { DataTypes } from 'sequelize';

const userModel = (sequelize) =>
  sequelize.define('users', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    answeredQuiz: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  });

export default userModel;
