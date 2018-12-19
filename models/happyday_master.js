'"use strict';

module.exports = function(sequelize, DataTypes) {
    var happyday_master = sequelize.define('happyday_master', {
                        happyday_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
                        happyday_name: {type: DataTypes.STRING, allowNull: false},
                        happyday_cotent: {type: DataTypes.TEXT, allowNull: true},
                        reg_user_id: {type: DataTypes.INTEGER, allowNull: true},
                        category_code: {type: DataTypes.STRING, allowNull: true},
                        reg_dtm: {type: DataTypes.STRING, allowNull: true},
                        dday_dt: {type: DataTypes.STRING, allowNull: true},
                        happyday_dt: {type: DataTypes.STRING, allowNull: true},
                        req_point: {type: DataTypes.INTEGER, allowNull: true},
                        cal_point_text: {type: DataTypes.STRING, allowNull: true},
                        state: {type: DataTypes.STRING, allowNull: true},
                        ref_url: {type: DataTypes.STRING, allowNull: true},
                        num_participants: {type: DataTypes.INTEGER, allowNull: true},
                        place_name: {type: DataTypes.STRING, allowNull: true},
                        place_latitude: {type: DataTypes.STRING, allowNull: true},
                        img_url: {type: DataTypes.STRING, allowNull: true},
                        point_rsn: {type: DataTypes.STRING, allowNull: true},
                        update_dtm: {type: DataTypes.STRING, allowNull: true},
                        place_longitude: {type: DataTypes.STRING, allowNull: true},
                        category_code2: {type: DataTypes.STRING, allowNull: true},
                        category_code3: {type: DataTypes.STRING, allowNull: true}
                    },{
                        classMethods: {},
                        tableName: 'happyday_master', // 쿼리에서의 테이블 이름을 설정
                        freezeTableName: true,  // true이면 tableName에 설정한 이름으로만 쿼리 생성
                        underscored: true,
                        timestamps: false // true이면 자동으로 등록시간, 수정시간 만들어줌
                    });
                    
    return happyday_master;
}