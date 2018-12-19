'"use strict';

module.exports = function(sequelize, DataTypes) {
    var vote_master = sequelize.define('vote_master', {
                        vote_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        subject: {type: DataTypes.STRING, allowNull: false},
                        comment: {type: DataTypes.TEXT, allowNull: false},
                        reg_user_id: {type: DataTypes.INTEGER, allowNull: false},
                        reg_dtm: {type: DataTypes.STRING, allowNull: false},
                        deadline: {type: DataTypes.STRING, allowNull: false},
                        modify_dtm: {type: DataTypes.STRING, allowNull: false},
                        state: {type: DataTypes.STRING, allowNull: false},
                        parti_org_id: {type: DataTypes.STRING, allowNull: false},
                        multi_yn: {type: DataTypes.STRING, allowNull: false},
                        secret_yn: {type: DataTypes.STRING, allowNull: false},
                        add_item_yn: {type: DataTypes.STRING, allowNull: false},
                        noti_yn: {type: DataTypes.STRING, allowNull: false}
                    },{
                        classMethods: {},
                        tableName: 'vote_master', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return vote_master;
}