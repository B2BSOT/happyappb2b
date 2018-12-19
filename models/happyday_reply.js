'"use strict';

module.exports = function(sequelize, DataTypes) {
    var happyday_reply = sequelize.define('happyday_reply', {
                        happydayreply_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        happyday_id: {type: DataTypes.INTEGER, allowNull: true},
                        user_id: {type: DataTypes.INTEGER, allowNull: true},
                        HDreply_contents: {type: DataTypes.STRING, allowNull: true},
                        HDreply_code: {type: DataTypes.STRING, allowNull: true},
                        followreply_id: {type: DataTypes.INTEGER, allowNull: true},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        update_dtm: {type: DataTypes.STRING, allowNull: true},
                        del_yn: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'happyday_reply', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return happyday_reply;
}