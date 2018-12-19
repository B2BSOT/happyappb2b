'"use strict';

module.exports = function(sequelize, DataTypes) {
    var quiz_board = sequelize.define('quiz_board', {
                        board_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        subject: {type: DataTypes.STRING, allowNull: false},
                        content: {type: DataTypes.TEXT, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                        days: {type: DataTypes.INTEGER, allowNull: false},
                        file_id: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'quiz_board',
                        freezeTableName: true,
                        underscored: true,
                        timestamps: false
                    });
                    
    return quiz_board;
}
